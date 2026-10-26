const { ipcMain } = require('electron');
const { listSystemPrinters, invalidatePrinterListCache } = require('./list-printers.cjs');
const { readPrinterSettings, writePrinterSettings } = require('./printer-settings.cjs');
const { printTicketHtml } = require('./print-ticket.cjs');
const { resolveReceiptPrinterName, resolveLabelPrinterName } = require('./resolve.cjs');

function registerPrinterIpc() {
  try {
    const { warmRawPrintWorker } = require('./win-raw-print.cjs');
    if (typeof warmRawPrintWorker === 'function') warmRawPrintWorker();
  } catch {
    /* optional */
  }

  ipcMain.handle('desktop:list-printers', async () => {
    invalidatePrinterListCache();
    return listSystemPrinters();
  });
  ipcMain.handle('desktop:get-printer-settings', () => readPrinterSettings());
  ipcMain.handle('desktop:set-printer-settings', (_e, settings) =>
    writePrinterSettings(settings || {}),
  );
  ipcMain.handle('desktop:print-ticket-html', (_e, payload) => printTicketHtml(payload || {}));
  ipcMain.handle('desktop:print-raw', async (_e, payload) => {
    const { printRawBuffer } = require('./win-raw-print.cjs');
    const text = String(payload?.bytes || '');
    return printRawBuffer(payload?.printerName, Buffer.from(text, 'utf8'));
  });

  try {
    const escposModule = require('../cashier-receipt-escpos/index.cjs');
    if (escposModule?.registerEscposIpcHandlers) {
      escposModule.registerEscposIpcHandlers(ipcMain, {
        resolveReceiptPrinterName,
        resolveLabelPrinterName,
      });
    }
  } catch (err) {
    console.warn('[escpos] module load failed:', err?.message || err);
  }
}

module.exports = { registerPrinterIpc };
