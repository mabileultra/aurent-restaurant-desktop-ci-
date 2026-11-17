const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PRINTER_HEALTH_CODES,
  inspectWin32StatusBitmask,
  inspectWin32CimPrinter,
  inspectCupsPrinter,
  createReceiptPrinterHealthChecker,
} = require('../electron/printers/receipt-printer-health.cjs');

test('inspectWin32StatusBitmask detects paper out, jam, door open, offline, paused, error', () => {
  assert.equal(inspectWin32StatusBitmask(0), null);
  assert.equal(inspectWin32StatusBitmask(0x00000010), PRINTER_HEALTH_CODES.NO_PAPER);
  assert.equal(inspectWin32StatusBitmask(0x00000040), PRINTER_HEALTH_CODES.NO_PAPER);
  assert.equal(inspectWin32StatusBitmask(0x00000008), PRINTER_HEALTH_CODES.PAPER_JAM);
  assert.equal(inspectWin32StatusBitmask(0x00400000), PRINTER_HEALTH_CODES.DOOR_OPEN);
  assert.equal(inspectWin32StatusBitmask(0x00000080), PRINTER_HEALTH_CODES.PRINTER_OFFLINE);
  assert.equal(inspectWin32StatusBitmask(0x00000001), PRINTER_HEALTH_CODES.PRINTER_PAUSED);
  assert.equal(inspectWin32StatusBitmask(0x00000002), PRINTER_HEALTH_CODES.PRINTER_ERROR);
});

test('inspectWin32CimPrinter detects WorkOffline and DetectedErrorState', () => {
  assert.equal(inspectWin32CimPrinter(null), null);
  assert.equal(inspectWin32CimPrinter({ WorkOffline: true }), PRINTER_HEALTH_CODES.PRINTER_OFFLINE);
  assert.equal(
    inspectWin32CimPrinter({ WorkOffline: false, DetectedErrorState: 4, PrinterStatus: 3 }),
    PRINTER_HEALTH_CODES.NO_PAPER,
  );
  assert.equal(
    inspectWin32CimPrinter({ WorkOffline: false, ExtendedDetectedErrorState: 8, PrinterStatus: 3 }),
    PRINTER_HEALTH_CODES.PAPER_JAM,
  );
  assert.equal(
    inspectWin32CimPrinter({ WorkOffline: false, DetectedErrorState: 7, PrinterStatus: 3 }),
    PRINTER_HEALTH_CODES.DOOR_OPEN,
  );
  assert.equal(
    inspectWin32CimPrinter({ WorkOffline: false, DetectedErrorState: 0, PrinterStatus: 3 }),
    null,
  );
});

test('inspectCupsPrinter detects CUPS paper empty, cover open and paused reasons', () => {
  assert.equal(inspectCupsPrinter({ status: 0, options: {} }, ''), null);
  assert.equal(
    inspectCupsPrinter({ status: 0, options: { 'printer-state-reasons': 'media-empty-error' } }, ''),
    PRINTER_HEALTH_CODES.NO_PAPER,
  );
  assert.equal(
    inspectCupsPrinter({ status: 0, options: {} }, 'printer XP80 disabled since Tue\n\treason: paused'),
    PRINTER_HEALTH_CODES.PRINTER_PAUSED,
  );
  assert.equal(
    inspectCupsPrinter({ status: 2, options: {} }, ''),
    PRINTER_HEALTH_CODES.PRINTER_OFFLINE,
  );
});

test('checkReceiptPrinterReady fails with NO_PRINTER when no printers or saved printer missing', async () => {
  const noPrinters = createReceiptPrinterHealthChecker({
    platform: 'win32',
    listSystemPrinters: async () => [],
    readPrinterSettings: () => ({ receiptPrinterName: '' }),
  });
  assert.deepEqual(await noPrinters(), {
    ok: false,
    code: PRINTER_HEALTH_CODES.NO_PRINTER,
    printerName: '',
    message: 'Принтер чеков не подключён или не выбран.',
  });

  const missingSaved = createReceiptPrinterHealthChecker({
    platform: 'win32',
    listSystemPrinters: async () => [{ name: 'Other Printer', status: 0 }],
    readPrinterSettings: () => ({ receiptPrinterName: 'XP-80C' }),
  });
  const res = await missingSaved();
  assert.equal(res.ok, false);
  assert.equal(res.code, PRINTER_HEALTH_CODES.NO_PRINTER);
});

test('checkReceiptPrinterReady fails on Windows NO_PAPER and succeeds when printer is ready', async () => {
  const outOfPaper = createReceiptPrinterHealthChecker({
    platform: 'win32',
    listSystemPrinters: async () => [{ name: 'XP-80C', status: 0 }],
    readPrinterSettings: () => ({ receiptPrinterName: 'XP-80C' }),
    probeWindowsPrinter: async () => ({
      WorkOffline: false,
      PrinterStatus: 6,
      DetectedErrorState: 4,
    }),
    loadPrinterDriver: () => null,
  });
  const failRes = await outOfPaper();
  assert.equal(failRes.ok, false);
  assert.equal(failRes.code, PRINTER_HEALTH_CODES.NO_PAPER);
  assert.equal(failRes.printerName, 'XP-80C');

  const ready = createReceiptPrinterHealthChecker({
    platform: 'win32',
    listSystemPrinters: async () => [{ name: 'XP-80C', status: 0 }],
    readPrinterSettings: () => ({ receiptPrinterName: 'XP-80C' }),
    probeWindowsPrinter: async () => ({
      WorkOffline: false,
      PrinterStatus: 3,
      DetectedErrorState: 0,
    }),
    loadPrinterDriver: () => null,
  });
  assert.deepEqual(await ready(), { ok: true, printerName: 'XP-80C' });
});

test('checkReceiptPrinterReady checks native driver connection when available', async () => {
  const disconnected = createReceiptPrinterHealthChecker({
    platform: 'darwin',
    listSystemPrinters: async () => [{ name: 'XP-80C', status: 0, options: {} }],
    readPrinterSettings: () => ({ receiptPrinterName: 'XP-80C' }),
    probeCupsPrinter: async () => 'printer XP-80C is idle.',
    loadPrinterDriver: () => ({}),
    createReceiptPrinter: (name) => ({ name }),
    checkConnected: async () => false,
  });
  const res = await disconnected();
  assert.equal(res.ok, false);
  assert.equal(res.code, PRINTER_HEALTH_CODES.PRINTER_OFFLINE);
});
