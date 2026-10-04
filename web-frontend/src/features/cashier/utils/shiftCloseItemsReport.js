import { printShiftItemsReceipt } from './printShiftItemsReceipt';

/**
 * Goods slip payload from a product or pharmacy close-shift response.
 * Offline close has no soldItems — then nothing is printed.
 */
export function shiftCloseItemsReport(closedShift, { storeName, cashierName } = {}) {
  const sold = closedShift?.soldItems;
  if (!sold || !Array.isArray(sold.items)) return null;
  return {
    items: sold.items,
    storeName: closedShift.storeName || storeName || '',
    cashierName: closedShift.cashierName || cashierName || '',
    openedAt: sold.from ?? null,
    reportAt: sold.to || closedShift.closedAt || null,
  };
}

export async function printSoldItemsOnShiftClose(closedShift, { storeName, cashierName, t } = {}) {
  const report = shiftCloseItemsReport(closedShift, { storeName, cashierName });
  if (!report) return { printed: false };
  const result = await printShiftItemsReceipt({ report, storeName, cashierName, t });
  return { printed: true, mode: result?.mode ?? null };
}
