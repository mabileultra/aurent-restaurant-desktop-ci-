import {
  isCashierEscposReportPrintAvailable,
  printReportEscpos,
} from '../../../services/cashierEscpos';
import { buildPharmacyShiftPrintReport } from './buildPharmacyShiftPrintReport';
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

/**
 * Pharmacy close: Z totals first, then sold-items slip.
 * Z uses shift aggregates (pharmacy has no grocery finalizeZReport button).
 */
export async function printPharmacyCloseReports(closedShift, { storeName, cashierName, t } = {}) {
  const zReport = buildPharmacyShiftPrintReport(closedShift, {
    reportType: 'Z',
    storeName,
    cashierName,
  });
  let zPrinted = false;
  if (zReport && isCashierEscposReportPrintAvailable()) {
    await printReportEscpos({ shiftReport: zReport, t });
    zPrinted = true;
  }
  const items = await printSoldItemsOnShiftClose(closedShift, { storeName, cashierName, t });
  return { zPrinted, items };
}
