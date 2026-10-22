const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function settingsPath() {
  return path.join(app.getPath('userData'), 'printer-settings.json');
}

function readStationPrinters(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = typeof value === 'string' ? value.trim() : '';
    if (key && name) out[String(key)] = name;
  }
  return out;
}

function readFile() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    return {};
  }
}

function readPrinterSettings() {
  const cfg = readFile();
  return {
    receiptPrinterName: cfg.receiptPrinterName || '',
    labelPrinterName: cfg.labelPrinterName || '',
    billPrinterName: cfg.billPrinterName || '',
    stationPrinters: readStationPrinters(cfg.stationPrinters),
  };
}

function writePrinterSettings(settings) {
  const next = { ...readFile() };
  if (typeof settings?.receiptPrinterName === 'string') {
    next.receiptPrinterName = settings.receiptPrinterName.trim();
  }
  if (typeof settings?.labelPrinterName === 'string') {
    next.labelPrinterName = settings.labelPrinterName.trim();
  }
  if (typeof settings?.billPrinterName === 'string') {
    next.billPrinterName = settings.billPrinterName.trim();
  }
  if (settings?.stationPrinters && typeof settings.stationPrinters === 'object') {
    next.stationPrinters = readStationPrinters(settings.stationPrinters);
  }
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
  return readPrinterSettings();
}

module.exports = { readPrinterSettings, writePrinterSettings };
