/**
 * IPC регистрации печати ESC/POS и выбора принтера.
 */
const { ipcMain } = require('electron');
const { readPrinterSettings, writePrinterSettings } = require('./printers/printer-settings.cjs');
const { showPrinterPickerWindow } = require('./printers/picker-window.cjs');
const {
  listSystemPrinters,
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
} = require('./printers/resolve.cjs');
const { getMainWindow } = require('./printers/window-ref.cjs');

function registerPrinterIpc() {
  ipcMain.handle('desktop:list-printers', async () => listSystemPrinters());
  ipcMain.handle('desktop:get-printer-settings', () => readPrinterSettings());
  ipcMain.handle('desktop:set-printer-settings', (_e, settings) =>
    writePrinterSettings(settings || {}),
  );

  ipcMain.handle('desktop:open-printer-picker', async () => {
    await showPrinterPickerWindow(getMainWindow(), { kind: 'receipt' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-label-printer-picker', async () => {
    await showPrinterPickerWindow(getMainWindow(), { kind: 'label' });
    return readPrinterSettings();
  });

  let escposModule = null;
  try {
    escposModule = require('./cashier-receipt-escpos');
  } catch (err) {
    console.warn('[escpos] module load failed:', err?.message || err);
  }

  if (escposModule?.registerEscposIpcHandlers) {
    escposModule.registerEscposIpcHandlers(ipcMain, {
      resolveReceiptPrinterName,
      resolveLabelPrinterName,
    });
  } else {
    ipcMain.handle('desktop:print-receipt-escpos', async () => {
      const error = new Error(
        'Печать чека недоступна в этой сборке. Обновите Aurent Cashier или обратитесь в поддержку.',
      );
      error.code = 'DRIVER_MISSING';
      throw error;
    });
  }
}

module.exports = { registerPrinterIpc };
