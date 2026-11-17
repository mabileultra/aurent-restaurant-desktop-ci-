const { execFile } = require('child_process');
const { matchPrinterName } = require('./printer-match.cjs');

const PRINTER_HEALTH_CODES = Object.freeze({
  NO_PRINTER: 'NO_PRINTER',
  NO_PAPER: 'NO_PAPER',
  PAPER_JAM: 'PAPER_JAM',
  DOOR_OPEN: 'DOOR_OPEN',
  PRINTER_OFFLINE: 'PRINTER_OFFLINE',
  PRINTER_PAUSED: 'PRINTER_PAUSED',
  PRINTER_ERROR: 'PRINTER_ERROR',
});

const DEFAULT_MESSAGES = Object.freeze({
  NO_PRINTER: 'Принтер чеков не подключён или не выбран.',
  NO_PAPER: 'В чековом принтере закончилась бумага.',
  PAPER_JAM: 'В чековом принтере замята бумага.',
  DOOR_OPEN: 'Крышка чекового принтера открыта.',
  PRINTER_OFFLINE: 'Чековый принтер недоступен (офлайн).',
  PRINTER_PAUSED: 'Печать на чековом принтере приостановлена.',
  PRINTER_ERROR: 'Ошибка чекового принтера.',
});

const WIN32_STATUS_FLAGS = [
  [0x00000010, PRINTER_HEALTH_CODES.NO_PAPER],
  [0x00000040, PRINTER_HEALTH_CODES.NO_PAPER],
  [0x00000008, PRINTER_HEALTH_CODES.PAPER_JAM],
  [0x00400000, PRINTER_HEALTH_CODES.DOOR_OPEN],
  [0x00000080, PRINTER_HEALTH_CODES.PRINTER_OFFLINE],
  [0x00001000, PRINTER_HEALTH_CODES.PRINTER_OFFLINE],
  [0x00000001, PRINTER_HEALTH_CODES.PRINTER_PAUSED],
  [0x00000002, PRINTER_HEALTH_CODES.PRINTER_ERROR],
  [0x00100000, PRINTER_HEALTH_CODES.PRINTER_ERROR],
];

const WIN32_ERROR_STATE_MAP = Object.freeze({
  4: PRINTER_HEALTH_CODES.NO_PAPER,
  7: PRINTER_HEALTH_CODES.DOOR_OPEN,
  8: PRINTER_HEALTH_CODES.PAPER_JAM,
  9: PRINTER_HEALTH_CODES.PRINTER_OFFLINE,
  10: PRINTER_HEALTH_CODES.PRINTER_ERROR,
  11: PRINTER_HEALTH_CODES.PRINTER_ERROR,
});

function fail(code, printerName = '') {
  return {
    ok: false,
    code,
    printerName: printerName || '',
    message: DEFAULT_MESSAGES[code] || DEFAULT_MESSAGES.PRINTER_ERROR,
  };
}

function inspectWin32StatusBitmask(status) {
  const num = Number(status);
  if (!Number.isFinite(num) || num <= 0) return null;
  for (const [mask, code] of WIN32_STATUS_FLAGS) {
    if ((num & mask) !== 0) return code;
  }
  return null;
}

function inspectWin32CimPrinter(row) {
  if (!row || typeof row !== 'object') return null;
  if (row.WorkOffline === true) return PRINTER_HEALTH_CODES.PRINTER_OFFLINE;

  const stateCode = inspectWin32StatusBitmask(row.PrinterState);
  if (stateCode) return stateCode;

  for (const errField of [row.ExtendedDetectedErrorState, row.DetectedErrorState]) {
    const code = WIN32_ERROR_STATE_MAP[Number(errField)];
    if (code) return code;
  }

  const printerStatus = Number(row.PrinterStatus);
  if (printerStatus === 7) return PRINTER_HEALTH_CODES.PRINTER_OFFLINE;
  if (printerStatus === 6) return PRINTER_HEALTH_CODES.PRINTER_PAUSED;
  if (printerStatus === 1 && Number(row.DetectedErrorState) === 1) {
    return PRINTER_HEALTH_CODES.PRINTER_ERROR;
  }
  return null;
}

function inspectCupsReasons(text) {
  const raw = String(text || '').toLowerCase();
  if (!raw) return null;
  if (/media-empty|media-needed|marker-supply-empty|no-paper/.test(raw)) {
    return PRINTER_HEALTH_CODES.NO_PAPER;
  }
  if (/media-jam|paper-jam/.test(raw)) {
    return PRINTER_HEALTH_CODES.PAPER_JAM;
  }
  if (/cover-open|door-open|interlock-open/.test(raw)) {
    return PRINTER_HEALTH_CODES.DOOR_OPEN;
  }
  if (/offline-report|timed-out|not-responding|unreachable/.test(raw)) {
    return PRINTER_HEALTH_CODES.PRINTER_OFFLINE;
  }
  if (/\bpaused\b|disabled since/.test(raw)) {
    return PRINTER_HEALTH_CODES.PRINTER_PAUSED;
  }
  return null;
}

function inspectCupsPrinter(printer, lpstatOutput = '') {
  const optionReasons = printer?.options?.['printer-state-reasons'];
  const reasonCode = inspectCupsReasons(
    `${Array.isArray(optionReasons) ? optionReasons.join(' ') : optionReasons || ''}\n${lpstatOutput || ''}`,
  );
  if (reasonCode) return reasonCode;
  if (Number(printer?.status) === 2) return PRINTER_HEALTH_CODES.PRINTER_OFFLINE;
  return null;
}

function defaultProbeWindowsPrinter(printerName) {
  const safeName = String(printerName || '').replace(/'/g, "''");
  const script = [
    `$p = Get-CimInstance -ClassName Win32_Printer -Filter "Name='${safeName}'" | Select-Object -First 1 WorkOffline,PrinterStatus,PrinterState,DetectedErrorState,ExtendedDetectedErrorState;`,
    'if ($p) { $p | ConvertTo-Json -Compress }',
  ].join(' ');
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 1800 },
      (err, stdout) => {
        if (err || !stdout || !stdout.trim()) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          resolve(null);
        }
      },
    );
  });
}

function defaultProbeCupsPrinter(printerName) {
  return new Promise((resolve) => {
    execFile(
      'lpstat',
      ['-p', String(printerName || ''), '-l'],
      { timeout: 1500 },
      (_err, stdout) => {
        resolve(stdout ? String(stdout) : '');
      },
    );
  });
}

function createReceiptPrinterHealthChecker(deps = {}) {
  const platform = deps.platform || process.platform;
  const getSettings =
    deps.readPrinterSettings ||
    (() => require('./printer-settings.cjs').readPrinterSettings());
  const listPrinters =
    deps.listSystemPrinters ||
    (() => {
      const lp = require('./list-printers.cjs');
      lp.invalidatePrinterListCache();
      return lp.listSystemPrinters();
    });
  const resolvePrinter =
    deps.resolveReceiptPrinterName ||
    (() => require('./resolve.cjs').resolveReceiptPrinterName());
  const matchName = deps.matchPrinterName || matchPrinterName;
  const probeWin32 = deps.probeWindowsPrinter || defaultProbeWindowsPrinter;
  const probeCups = deps.probeCupsPrinter || defaultProbeCupsPrinter;
  const getDriver =
    deps.loadPrinterDriver ||
    (() => require('../cashier-receipt-escpos/escpos-printer-service.cjs').loadPrinterDriver());
  const makePrinter =
    deps.createReceiptPrinter ||
    ((name) => require('../cashier-receipt-escpos/escpos-printer-service.cjs').createReceiptPrinter(name));
  const isNativeConnected =
    deps.checkConnected ||
    ((printer) => require('../cashier-receipt-escpos/escpos-printer-service.cjs').checkConnected(printer));

  return async function checkReceiptPrinterReady() {
    const printers = await listPrinters();
    const list = Array.isArray(printers) ? printers : [];
    if (list.length === 0) {
      return fail(PRINTER_HEALTH_CODES.NO_PRINTER, '');
    }

    const saved = String(getSettings()?.receiptPrinterName || '').trim();
    const candidate = saved || String((await resolvePrinter()) || '').trim();
    const matchedName = matchName(candidate, list);
    if (!matchedName) {
      return fail(PRINTER_HEALTH_CODES.NO_PRINTER, candidate);
    }

    const printerEntry = list.find((p) => p?.name === matchedName) || { name: matchedName };

    if (platform === 'win32') {
      const bitmaskCode = inspectWin32StatusBitmask(printerEntry.status);
      if (bitmaskCode) return fail(bitmaskCode, matchedName);

      const cimRow = await probeWin32(matchedName);
      const cimCode = inspectWin32CimPrinter(cimRow);
      if (cimCode) return fail(cimCode, matchedName);
    } else {
      const quickCode = inspectCupsPrinter(printerEntry, '');
      if (quickCode) return fail(quickCode, matchedName);

      const lpstatOut = await probeCups(matchedName);
      const cupsCode = inspectCupsPrinter(printerEntry, lpstatOut);
      if (cupsCode) return fail(cupsCode, matchedName);
    }

    if (getDriver()) {
      try {
        const printer = makePrinter(matchedName);
        const connected = await isNativeConnected(printer);
        if (!connected) return fail(PRINTER_HEALTH_CODES.PRINTER_OFFLINE, matchedName);
      } catch {
        return fail(PRINTER_HEALTH_CODES.PRINTER_OFFLINE, matchedName);
      }
    }

    return { ok: true, printerName: matchedName };
  };
}

let defaultChecker = null;
function checkReceiptPrinterReady() {
  if (!defaultChecker) {
    defaultChecker = createReceiptPrinterHealthChecker();
  }
  return defaultChecker();
}

module.exports = {
  PRINTER_HEALTH_CODES,
  inspectWin32StatusBitmask,
  inspectWin32CimPrinter,
  inspectCupsReasons,
  inspectCupsPrinter,
  createReceiptPrinterHealthChecker,
  checkReceiptPrinterReady,
};
