import { isCashierEscposPrintAvailable } from './printSaleReceiptEscpos';

export const RECEIPT_PRINTER_ERROR_KEYS = Object.freeze({
  NO_PRINTER: [
    'pos.receiptPrinterNotFound',
    'Принтер чеков не подключён или не выбран. Подключите принтер и выберите его в настройках («Принтер чека»).',
  ],
  NO_PAPER: [
    'pos.receiptPrinterNoPaper',
    'В чековом принтере закончилась бумага. Заправьте бумагу перед завершением продажи.',
  ],
  PAPER_JAM: [
    'pos.receiptPrinterPaperJam',
    'В чековом принтере замята бумага. Устраните замятие перед завершением продажи.',
  ],
  DOOR_OPEN: [
    'pos.receiptPrinterDoorOpen',
    'Крышка чекового принтера открыта. Закройте крышку перед завершением продажи.',
  ],
  PRINTER_OFFLINE: [
    'pos.receiptPrinterOffline',
    'Чековый принтер недоступен. Проверьте питание и подключение.',
  ],
  PRINTER_PAUSED: [
    'pos.receiptPrinterPaused',
    'Печать на чековом принтере приостановлена. Возобновите работу принтера.',
  ],
  PRINTER_ERROR: [
    'pos.receiptPrinterError',
    'Ошибка чекового принтера. Проверьте состояние принтера перед завершением продажи.',
  ],
});

/**
 * Resolves a localized error message for pre-sale printer readiness checks.
 * @param {unknown} err
 * @param {Function} t
 */
export function resolveReceiptPrinterErrorMessage(err, t) {
  const code = err?.code || '';
  const entry = RECEIPT_PRINTER_ERROR_KEYS[code] || RECEIPT_PRINTER_ERROR_KEYS.PRINTER_ERROR;
  if (typeof t === 'function') {
    return t(entry[0], { defaultValue: entry[1] });
  }
  return err?.message || entry[1];
}

/**
 * Checks receipt printer availability and paper state in Electron Desktop before sale/fiscalization.
 */
export async function assertReceiptPrinterReady() {
  if (!isCashierEscposPrintAvailable()) {
    return { ok: true, skipped: true };
  }
  const checkFn = window.desktopCashier?.checkReceiptPrinterReady;
  if (typeof checkFn !== 'function') {
    return { ok: true, skipped: true };
  }

  let status;
  try {
    status = await checkFn();
  } catch (cause) {
    const err = new Error(cause?.message || RECEIPT_PRINTER_ERROR_KEYS.PRINTER_ERROR[1]);
    err.code = cause?.code || 'PRINTER_ERROR';
    err.isReceiptPrinterError = true;
    err.cause = cause;
    throw err;
  }

  if (status?.ok) {
    return status;
  }

  const code = status?.code || 'PRINTER_ERROR';
  const entry = RECEIPT_PRINTER_ERROR_KEYS[code] || RECEIPT_PRINTER_ERROR_KEYS.PRINTER_ERROR;
  const err = new Error(status?.message || entry[1]);
  err.code = code;
  err.isReceiptPrinterError = true;
  err.printerName = status?.printerName || '';
  throw err;
}
