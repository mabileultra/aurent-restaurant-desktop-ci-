/**
 * Обёртка node-thermal-printer + системный драйвер принтера.
 * Fallback на Windows: RAW через PowerShell (без native @thiagoelg/node-printer).
 */
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { normalizeLocale, resolveCharacterSet } = require('./escpos-encoding.cjs');

/** @type {object|null|undefined} */
let cachedPrinterDriver = undefined;

function loadPrinterDriver() {
  if (cachedPrinterDriver !== undefined) {
    return cachedPrinterDriver;
  }
  const candidates = ['@thiagoelg/node-printer'];
  for (const name of candidates) {
    try {
      // Native addon may be missing until electron-rebuild on Windows.
      // eslint-disable-next-line import/no-dynamic-require, global-require
      cachedPrinterDriver = require(name);
      return cachedPrinterDriver;
    } catch {
      /* try next */
    }
  }
  cachedPrinterDriver = null;
  return null;
}

/**
 * @param {{ paperWmm?: number, kind?: 'receipt'|'label' }} options
 */
function resolvePrintWidth(options = {}) {
  if (options.width) return options.width;
  if (options.kind === 'label') {
    const mm = Number(options.paperWmm) || 58;
    if (mm <= 35) return 24;
    if (mm <= 45) return 28;
    return 32;
  }
  const mm = Number(options.paperWmm) || 80;
  if (mm <= 58) return 32;
  if (mm <= 70) return 40;
  return 42;
}

/**
 * @param {string} deviceName
 * @param {{ locale?: string, kind?: 'receipt'|'label', paperWmm?: number, width?: number, noPrinterMessage?: string, driverMissingMessage?: string }} [options]
 */
function createEscposPrinter(deviceName, options = {}) {
  const name = String(deviceName || '').trim();
  const isLabel = options.kind === 'label';
  if (!name) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.NO_PRINTER,
      options.noPrinterMessage ||
        (isLabel
          ? 'Принтер этикеток не выбран. Aurent → «Принтер штрих-кодов».'
          : 'Принтер чека не выбран. Aurent → «Принтер чека».'),
      { step: 'create_printer' },
    );
  }

  const locale = normalizeLocale(options.locale);
  const characterSet = resolveCharacterSet(locale);
  const width = resolvePrintWidth(options);
  const driver = loadPrinterDriver();

  if (driver) {
    return new ThermalPrinter({
      type: PrinterTypes.EPSON,
      width,
      interface: `printer:${name}`,
      characterSet,
      removeSpecialCharacters: false,
      driver,
      options: { timeout: 8000 },
    });
  }

  if (process.platform === 'win32') {
    // Buffer-only printer; executePrint отправит RAW через winspool.
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      width,
      interface: 'tcp://127.0.0.1:9',
      characterSet,
      removeSpecialCharacters: false,
      options: { timeout: 8000 },
    });
    printer.__aurentRawPrinterName = name;
    return printer;
  }

  throw new EscposPrintError(
    ESCPOS_ERROR_CODES.DRIVER_MISSING,
    options.driverMissingMessage ||
      'Модуль печати не найден в установке. Обновите Aurent Cashier или обратитесь в поддержку.',
    { step: 'load_driver' },
  );
}

function createReceiptPrinter(deviceName, options = {}) {
  return createEscposPrinter(deviceName, { ...options, kind: 'receipt' });
}

function createLabelPrinter(deviceName, options = {}) {
  return createEscposPrinter(deviceName, {
    ...options,
    kind: 'label',
    paperWmm: options.paperWmm,
  });
}

async function checkConnected(printer) {
  if (printer?.__aurentRawPrinterName) return true;
  try {
    return await printer.isPrinterConnected();
  } catch {
    return false;
  }
}

async function executePrint(printer) {
  try {
    if (printer?.__aurentRawPrinterName) {
      const { printRawBuffer } = require('../printers/win-raw-print.cjs');
      const buffer = typeof printer.getBuffer === 'function' ? printer.getBuffer() : null;
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 8) {
        throw new Error('Пустой буфер ESC/POS');
      }
      await printRawBuffer(printer.__aurentRawPrinterName, buffer);
      return;
    }
    const ok = await printer.execute();
    if (!ok) {
      throw new Error('execute() вернул false');
    }
  } catch (err) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.EXECUTE_FAILED,
      err?.message || 'Печать на принтере не выполнена',
      { step: 'execute', cause: err instanceof Error ? err : undefined },
    );
  }
}

module.exports = {
  loadPrinterDriver,
  createEscposPrinter,
  createReceiptPrinter,
  createLabelPrinter,
  resolvePrintWidth,
  checkConnected,
  executePrint,
};
