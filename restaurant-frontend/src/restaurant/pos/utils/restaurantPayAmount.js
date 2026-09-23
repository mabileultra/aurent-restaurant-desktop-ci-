import { round2 } from '../../../utils/taxAmounts';

/**
 * Sum the cashier must charge: billable subtotal + dine-in service − discount.
 * Prefer server commission fields; fall back to live preview before bill/pay snapshot.
 */
export function resolveRestaurantPayTotal(order, commissionPreview = null) {
  if (!order) return 0;
  const channel = order.channel || 'DINE_IN';
  const subtotal = round2(Number(order.subtotal) || 0);
  const discount = round2(Math.max(0, Number(order.discountAmount) || 0));

  if (channel !== 'DINE_IN') {
    return round2(Math.max(0, subtotal - discount));
  }

  const service = order.commissionAmount != null
    ? round2(Number(order.commissionAmount) || 0)
    : round2(Number(commissionPreview?.amount) || 0);
  return round2(Math.max(0, subtotal + service - discount));
}

/** JSON-safe money amount (avoids 10.100000000000001 payloads). */
export function toPayAmountPayload(value) {
  return Number(round2(value).toFixed(2));
}
