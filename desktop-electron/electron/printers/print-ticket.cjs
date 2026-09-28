/**
 * Тихая печать кухонного чека и счёта гостю на выбранный Windows-принтер.
 */
const { BrowserWindow } = require('electron');
const { invokeWebContentsPrint } = require('./print-thermal.cjs');

function ticketDocument(bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 80mm auto; margin: 3mm; }
    body { margin: 0; width: 72mm; color: #000; font-family: ui-monospace, Consolas, monospace; font-size: 13px; line-height: 1.35; }
    h3 { margin: 8px 0 4px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #000; }
    p { margin: 0 0 4px; }
  </style></head><body>${bodyHtml || ''}</body></html>`;
}

async function printTicketHtml({ html, printerName } = {}) {
  const deviceName = String(printerName || '').trim();
  if (!deviceName) {
    throw new Error('Принтер не выбран');
  }
  const win = new BrowserWindow({
    show: false,
    width: 420,
    height: 900,
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  try {
    const doc = ticketDocument(html);
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`);
    await invokeWebContentsPrint(
      win.webContents,
      {
        silent: true,
        deviceName,
        printBackground: true,
        margins: { marginType: 'none' },
        preferCSSPageSize: true,
      },
      12000,
      { acceptCallbackTimeout: true },
    );
    return { ok: true, deviceName };
  } finally {
    if (!win.isDestroyed()) win.close();
  }
}

module.exports = { printTicketHtml };
