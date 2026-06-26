/**
 * Конфиг автопечати чека ESC/POS (только aurent-cashier-desktop).
 * Не смешивать с printReceipt.js (window.print).
 */

export const CASHIER_ESCPOS_IPC = 'desktop:print-receipt-escpos';

export const CASHIER_ESCPOS_TOAST = Object.freeze({
  toastId: 'cashier-escpos-print',
  successDurationMs: 3000,
  errorDurationMs: 6000,
});
