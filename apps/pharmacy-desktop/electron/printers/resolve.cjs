const { dialog } = require('electron');
const { readPrinterSettings, writePrinterSettings } = require('./printer-settings.cjs');
const { showPrinterPickerWindow } = require('./picker-window.cjs');
const { matchPrinterName } = require('./printer-match.cjs');
const { getMainWindow } = require('./window-ref.cjs');

const PRINTER_KIND = {
  receipt: { field: 'receiptPrinterName', pickerKind: 'receipt' },
  label: { field: 'labelPrinterName', pickerKind: 'label' },
};

const LIST_TTL_MS = 120_000;
const EMPTY_LIST_TTL_MS = 5_000;

function createPrinterResolver(deps = {}) {
  const getSettings = deps.readPrinterSettings || readPrinterSettings;
  const saveSettings = deps.writePrinterSettings || writePrinterSettings;
  const openPicker = deps.showPrinterPickerWindow || showPrinterPickerWindow;
  const findMainWindow = deps.getMainWindow || getMainWindow;
  const showDialog = deps.showDialog || ((opts) => dialog.showMessageBoxSync(opts));
  const nowFn = deps.now || Date.now;

  let listCache = { at: 0, printers: null, pending: null };

  function clearCache() {
    listCache = { at: 0, printers: null, pending: null };
  }

  async function listSystemPrinters({ forceRefresh = false, fallbackWebContents = null } = {}) {
    const now = nowFn();
    const ttl = listCache.printers?.length ? LIST_TTL_MS : EMPTY_LIST_TTL_MS;
    if (!forceRefresh && listCache.printers && now - listCache.at < ttl) {
      return listCache.printers;
    }
    if (!forceRefresh && listCache.pending) return listCache.pending;

    const pendingPromise = (async () => {
      const mainWindow = findMainWindow();
      const wc =
        mainWindow && !mainWindow.isDestroyed()
          ? mainWindow.webContents
          : fallbackWebContents && !fallbackWebContents.isDestroyed()
            ? fallbackWebContents
            : null;
      if (!wc) {
        listCache = { at: nowFn(), printers: [], pending: null };
        return [];
      }
      try {
        const printers = await wc.getPrintersAsync();
        const next = Array.isArray(printers) ? printers : [];
        listCache = { at: nowFn(), printers: next, pending: null };
        return next;
      } catch {
        listCache = { at: nowFn(), printers: [], pending: null };
        return [];
      }
    })();

    listCache = { ...listCache, pending: pendingPromise };
    return pendingPromise;
  }

  async function resolvePrinterByKind(kind, { promptIfMissing = true } = {}) {
    const meta = PRINTER_KIND[kind] || PRINTER_KIND.receipt;
    const saved = String(getSettings()[meta.field] || '').trim();
    if (!promptIfMissing && saved) {
      return saved;
    }

    const printers = await listSystemPrinters();

    const matched = matchPrinterName(saved, printers);
    if (matched) {
      if (matched !== saved) {
        saveSettings({ [meta.field]: matched });
      }
      return matched;
    }

    if (saved && printers.length > 0) {
      saveSettings({ [meta.field]: '' });
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
      showDialog({
        type: 'warning',
        title: 'Aurent — печать',
        message: 'В Windows не найден ни один принтер.',
        detail:
          'Подключите термопринтер, установите драйвер, затем: меню Aurent → «Принтер чека».',
        buttons: ['OK'],
      });
      return '';
    }

    await openPicker(findMainWindow(), { kind: meta.pickerKind });
    const chosen = getSettings()[meta.field] || '';
    if (!chosen) {
      throw new Error('Принтер не выбран. Меню Aurent → «Принтер чека».');
    }
    return chosen;
  }

  return {
    listSystemPrinters,
    resolvePrinterByKind,
    clearSystemPrintersCache: clearCache,
  };
}

const defaultResolver = createPrinterResolver();

function listSystemPrinters(options) {
  return defaultResolver.listSystemPrinters(options);
}

function resolvePrinterByKind(kind, options) {
  return defaultResolver.resolvePrinterByKind(kind, options);
}

function clearSystemPrintersCache() {
  return defaultResolver.clearSystemPrintersCache();
}

function resolveReceiptPrinterName(options) {
  return resolvePrinterByKind('receipt', options);
}

function resolveLabelPrinterName(options) {
  return resolvePrinterByKind('label', options);
}

module.exports = {
  LIST_TTL_MS,
  EMPTY_LIST_TTL_MS,
  createPrinterResolver,
  clearSystemPrintersCache,
  listSystemPrinters,
  resolvePrinterByKind,
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
};
