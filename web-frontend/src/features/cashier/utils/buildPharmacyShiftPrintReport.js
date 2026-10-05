/**
 * Pharmacy X/Z print payload for ESC/POS / ShiftReportPrintBody.
 * Must use `reportType` (not `kind`) — desktop validateShiftReportPayload requires it.
 */
export function buildPharmacyShiftPrintReport(shift, {
  reportType,
  storeName,
  cashierName,
  reportAt,
} = {}) {
  if (!shift || (reportType !== 'X' && reportType !== 'Z')) return null;

  return {
    reportType,
    shiftId: shift.id ?? null,
    storeId: shift.storeId ?? null,
    storeName: shift.storeName || storeName || '',
    cashierName: shift.cashierName || cashierName || '',
    openedAt: shift.openedAt || null,
    reportAt: reportAt || shift.closedAt || shift.reportAt || new Date().toISOString(),
    saleCount: Number(shift.saleCount ?? 0) || 0,
    totalAmount: shift.totalAmount ?? 0,
    cashAmount: shift.cashAmount ?? 0,
    cardAmount: shift.cardAmount ?? 0,
    humoAmount: shift.humoAmount ?? 0,
    uzcardAmount: shift.uzcardAmount ?? 0,
    cashlessAmount: shift.cashlessAmount ?? 0,
    vatAmount: shift.vatAmount ?? 0,
    discountTotal: shift.discountTotal ?? 0,
    lineDiscountTotal: shift.lineDiscountTotal ?? 0,
    orderDiscountTotal: shift.orderDiscountTotal ?? 0,
    returnsCount: Number(shift.returnsCount ?? 0) || 0,
    returnsCash: shift.returnsCash ?? 0,
    returnsCard: shift.returnsCard ?? 0,
    returnsHumo: shift.returnsHumo ?? 0,
    returnsUzcard: shift.returnsUzcard ?? 0,
    returnsCashless: shift.returnsCashless ?? 0,
    returnsVat: shift.returnsVat ?? 0,
  };
}
