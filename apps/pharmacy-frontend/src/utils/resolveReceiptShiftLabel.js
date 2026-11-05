import { formatCashierShiftLabel } from './formatCashierShiftLabel';

/**
 * Подпись «Смена» на чеке.
 * Не брать хвост номера чека (PHR-…-0001 → «001») — это не номер смены.
 */
export function resolveReceiptShiftLabel(sale, { envShiftNo } = {}) {
  return formatCashierShiftLabel(sale, { envShiftNo });
}
