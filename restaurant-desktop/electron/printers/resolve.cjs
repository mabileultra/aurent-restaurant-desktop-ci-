const { listSystemPrinters, invalidatePrinterListCache } = require('./list-printers.cjs');
const { matchPrinterName } = require('./printer-match.cjs');
const { readPrinterSettings } = require('./printer-settings.cjs');

async function resolvePrinterField(field, hintRe) {
  const saved = readPrinterSettings()[field];
  const printers = await listSystemPrinters();
  const matched = matchPrinterName(saved, printers);
  if (matched) return matched;
  const hinted = printers.find((p) => hintRe.test(String(p.name || '')));
  if (hinted?.name) return hinted.name;
  const def = printers.find((p) => p.isDefault);
  return def?.name || saved || '';
}

function resolveReceiptPrinterName() {
  return resolvePrinterField(
    'receiptPrinterName',
    /pos-80|pos80|xprinter|termo|receipt|thermal|чек/i,
  );
}

function resolveLabelPrinterName() {
  return resolvePrinterField(
    'labelPrinterName',
    /label|zebra|tsc|barcode|этикет|штрих|godex|argox|xp-365/i,
  );
}

module.exports = {
  listSystemPrinters,
  invalidatePrinterListCache,
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
};
