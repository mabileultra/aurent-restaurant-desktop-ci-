const { BrowserWindow } = require('electron');
const { listSystemPrinters } = require('./list-printers.cjs');
const { matchPrinterName } = require('./printer-match.cjs');

function paperMm(name) {
  return /58/.test(String(name || '')) ? 58 : 80;
}

function ticketDocument(bodyHtml, mm) {
  const width = Math.max(40, mm - 6);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${mm}mm auto; margin: 2mm; }
    body { margin: 0; width: ${width}mm; color: #000; font-family: ui-monospace, Consolas, monospace; font-size: 13px; line-height: 1.35; }
    p { margin: 0 0 4px; }
  </style></head><body>${bodyHtml || ''}</body></html>`;
}

function printSilent(webContents, opts, timeoutMs = 12_000) {
  return new Promise((resolve, reject) => {
    if (!webContents || webContents.isDestroyed()) {
      reject(new Error('Окно печати недоступно'));
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ callbackTimeout: true, success: true });
    }, timeoutMs);
    try {
      webContents.print(opts, (success, failureReason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (success) {
          resolve({ success: true });
          return;
        }
        const detail =
          failureReason && failureReason !== 'cancelled' ? failureReason : 'Печать не выполнена';
        reject(new Error(detail));
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

async function printTicketHtml({ html, printerName } = {}) {
  const requested = String(printerName || '').trim();
  if (!requested) throw new Error('Принтер не выбран');
  const printers = await listSystemPrinters();
  const deviceName = matchPrinterName(requested, printers) || requested;
  const mm = paperMm(deviceName);
  const win = new BrowserWindow({
    show: false,
    width: 420,
    height: 900,
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  try {
    const doc = ticketDocument(html, mm);
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`);
    await printSilent(win.webContents, {
      silent: true,
      deviceName,
      printBackground: true,
      margins: { marginType: 'none' },
      preferCSSPageSize: true,
      pageSize: { width: mm * 1000, height: 200000 },
    });
    return { ok: true, deviceName };
  } finally {
    if (!win.isDestroyed()) win.close();
  }
}

module.exports = { printTicketHtml };
