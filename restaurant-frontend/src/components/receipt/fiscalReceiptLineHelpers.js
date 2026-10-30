import { extractVatFromInclusive } from '../../utils/taxAmounts';

export function lineVatRatePercent(item) {
  const rate = item?.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= 0.001) return stored;
  const rate = lineVatRatePercent(item);
  const lineTotal = Number(item?.lineTotal) || 0;
  return extractVatFromInclusive(lineTotal, rate);
}

export function itemUnitPrice(item) {
  const direct = Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const qty = Number(item?.quantity) || 0;
  const total = Number(item?.lineTotal) || 0;
  return qty > 0 ? total / qty : total;
}

export const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  CASHLESS: 'sales.paymentCashless',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};
