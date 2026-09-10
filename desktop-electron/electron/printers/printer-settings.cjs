const { readUserConfig, writeUserConfig } = require('../config/desktopConfig');

function readPrinterSettings() {
  const cfg = readUserConfig() || {};
  return {
    receiptPrinterName: cfg.receiptPrinterName || '',
    labelPrinterName: cfg.labelPrinterName || '',
  };
}

function writePrinterSettings(settings) {
  const patch = {};
  if (typeof settings?.receiptPrinterName === 'string') {
    patch.receiptPrinterName = settings.receiptPrinterName.trim();
  }
  if (typeof settings?.labelPrinterName === 'string') {
    patch.labelPrinterName = settings.labelPrinterName.trim();
  }
  writeUserConfig(patch);
  return readPrinterSettings();
}

module.exports = { readPrinterSettings, writePrinterSettings };
