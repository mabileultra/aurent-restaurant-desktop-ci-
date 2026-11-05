const { readUserConfig, writeUserConfig } = require('../config/desktopConfig');

function readStationPrinters(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = typeof value === 'string' ? value.trim() : '';
    if (key && name) out[String(key)] = name;
  }
  return out;
}

function readPrinterSettings() {
  const cfg = readUserConfig() || {};
  return {
    receiptPrinterName: cfg.receiptPrinterName || '',
    labelPrinterName: cfg.labelPrinterName || '',
    /** driver = Windows GDI queue; tspl = RAW TSPL into that same Windows printer (USB ok). */
    labelPrinterMode: cfg.labelPrinterMode === 'tspl' ? 'tspl' : 'driver',
    billPrinterName: cfg.billPrinterName || '',
    stationPrinters: readStationPrinters(cfg.stationPrinters),
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
  if (settings?.labelPrinterMode === 'tspl' || settings?.labelPrinterMode === 'driver') {
    patch.labelPrinterMode = settings.labelPrinterMode;
  }
  if (typeof settings?.billPrinterName === 'string') {
    patch.billPrinterName = settings.billPrinterName.trim();
  }
  if (settings?.stationPrinters && typeof settings.stationPrinters === 'object') {
    patch.stationPrinters = readStationPrinters(settings.stationPrinters);
  }
  writeUserConfig(patch);
  return readPrinterSettings();
}

module.exports = { readPrinterSettings, writePrinterSettings };
