/**
 * IPC: принтеры чека/штрихкодов, ESC/POS, TSPL, страница штрихкодов.
 */
const { ipcMain } = require('electron');
const { loadDesktopConfig } = require('./config/desktopConfig');
const { cashierUrlForUi } = require('./ui/activeUiOrigin');
const { readPrinterSettings, writePrinterSettings } = require('./printers/printer-settings.cjs');
const { showPrinterPickerWindow } = require('./printers/picker-window.cjs');
const {
  listSystemPrinters,
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
} = require('./printers/resolve.cjs');
const { getMainWindow } = require('./printers/window-ref.cjs');
const { printTicketHtml } = require('./printers/print-ticket.cjs');
const { registerLabelPrintIpc } = require('./labelPrintIpc');

function registerPrinterIpc() {
  ipcMain.handle('desktop:list-printers', async () => listSystemPrinters());
  ipcMain.handle('desktop:get-printer-settings', () => readPrinterSettings());
  ipcMain.handle('desktop:set-printer-settings', (_e, settings) =>
    writePrinterSettings(settings || {}),
  );
  ipcMain.handle('desktop:print-ticket-html', (_e, payload) =>
    printTicketHtml(payload || {}),
  );

  ipcMain.handle('desktop:open-printer-picker', async () => {
    await showPrinterPickerWindow(getMainWindow(), { kind: 'receipt' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-label-printer-picker', async () => {
    await showPrinterPickerWindow(getMainWindow(), { kind: 'label' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-barcode-page', () => {
    const mainWindow = getMainWindow();
    const config = loadDesktopConfig({ isPackaged: require('electron').app.isPackaged });
    const base = cashierUrlForUi(config);
    if (mainWindow && !mainWindow.isDestroyed() && base) {
      mainWindow.loadURL(`${base}/users/barcode-print`);
    }
    return { ok: true };
  });

  let escposModule = null;
  let escposLoadError = '';
  try {
    escposModule = require('./cashier-receipt-escpos/index.cjs');
  } catch (err) {
    escposLoadError = String(err?.message || err);
    console.warn('[escpos] module load failed:', escposLoadError);
  }

  if (escposModule?.registerEscposIpcHandlers) {
    escposModule.registerEscposIpcHandlers(ipcMain, {
      resolveReceiptPrinterName,
      resolveLabelPrinterName,
    });
  } else {
    const detail = escposLoadError ? ` (${escposLoadError})` : '';
    ipcMain.handle('desktop:print-receipt-escpos', async () => {
      const error = new Error(
        `Печать чека недоступна в этой сборке${detail}. Обновите Aurent Cashier или обратитесь в поддержку.`,
      );
      error.code = 'DRIVER_MISSING';
      throw error;
    });
  }

  try {
    const { registerLabelTsplIpc } = require('./label-tspl/index.cjs');
    registerLabelTsplIpc(ipcMain);
  } catch (err) {
    console.warn('[label-tspl] module load failed:', err?.message || err);
  }

  try {
    registerLabelPrintIpc();
  } catch (err) {
    console.warn('[label-print] register failed:', err?.message || err);
  }
}

module.exports = { registerPrinterIpc };
