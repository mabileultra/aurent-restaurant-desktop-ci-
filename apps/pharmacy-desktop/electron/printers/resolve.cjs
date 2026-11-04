const { dialog } = require('electron');
const { readPrinterSettings, writePrinterSettings } = require('./printer-settings.cjs');
const { showPrinterPickerWindow } = require('./picker-window.cjs');
const { matchPrinterName } = require('./printer-match.cjs');
const { getMainWindow } = require('./window-ref.cjs');

const PRINTER_KIND = {
  receipt: { field: 'receiptPrinterName', pickerKind: 'receipt' },
  label: { field: 'labelPrinterName', pickerKind: 'label' },
};

const LIST_TTL_MS = 10_000;
let listCache = { at: 0, printers: null, pending: null };

async function listSystemPrinters() {
  const now = Date.now();
  if (listCache.printers && now - listCache.at < LIST_TTL_MS) {
    return listCache.printers;
  }
  if (listCache.pending) return listCache.pending;
  listCache.pending = (async () => {
    const mainWindow = getMainWindow();
    const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;
    if (!wc) {
      listCache = { at: Date.now(), printers: [], pending: null };
      return [];
    }
    try {
      const printers = await wc.getPrintersAsync();
      const next = Array.isArray(printers) ? printers : [];
      listCache = { at: Date.now(), printers: next, pending: null };
      return next;
    } catch {
      listCache = { at: Date.now(), printers: [], pending: null };
      return [];
    }
  })();
  return listCache.pending;
}

async function resolvePrinterByKind(kind, { promptIfMissing = true } = {}) {
  const meta = PRINTER_KIND[kind] || PRINTER_KIND.receipt;
  const saved = readPrinterSettings()[meta.field];
  const printers = await listSystemPrinters();

  const matched = matchPrinterName(saved, printers);
  if (matched) {
    if (matched !== saved) {
      writePrinterSettings({ [meta.field]: matched });
    }
    return matched;
  }

  if (saved && printers.length > 0) {
    writePrinterSettings({ [meta.field]: '' });
  }

  if (!promptIfMissing) {
    if (kind === 'label') {
      const labelLike = printers.find((p) =>
        /label|zebra|tsc|barcode|этикет|штрих|godex|argox|xprinter.*365|xp-365/i.test(p.name),
      );
      if (labelLike?.name) return labelLike.name;
      return '';
    }
    const thermal = printers.find((p) =>
      /pos-80|pos80|xprinter|termo|receipt|thermal|чек/i.test(p.name),
    );
    if (thermal?.name) return thermal.name;
    const def = printers.find((p) => p.isDefault);
    if (def?.name) return def.name;
    return saved || '';
  }

  if (!printers.length) {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Aurent — печать',
      message: 'В Windows не найден ни один принтер.',
      detail:
        'Подключите термопринтер, установите драйвер, затем: меню Aurent → «Принтер чека».',
      buttons: ['OK'],
    });
    return '';
  }

  await showPrinterPickerWindow(getMainWindow(), { kind: meta.pickerKind });
  const chosen = readPrinterSettings()[meta.field] || '';
  if (!chosen) {
    throw new Error('Принтер не выбран. Меню Aurent → «Принтер чека».');
  }
  return chosen;
}

function resolveReceiptPrinterName(options) {
  return resolvePrinterByKind('receipt', options);
}

function resolveLabelPrinterName(options) {
  return resolvePrinterByKind('label', options);
}

module.exports = {
  listSystemPrinters,
  resolvePrinterByKind,
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
};
