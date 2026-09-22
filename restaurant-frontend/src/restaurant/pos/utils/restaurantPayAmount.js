import { round2 } from '../../../utils/taxAmounts';

/**
 * Sum the cashier must charge: billable subtotal + dine-in service (commission).
 * Prefer server commission fields; fall back to live preview before bill/pay snapshot.
 */
export function resolveRestaurantPayTotal(order, commissionPreview = null) {
  if (!order) return 0;
  const channel = order.channel || 'DINE_IN';
  const subtotal = round2(Number(order.subtotal) || 0);
  if (channel !== 'DINE_IN') return subtotal;

  const service = order.commissionAmount != null
    ? round2(Number(order.commissionAmount) || 0)
    : round2(Number(commissionPreview?.amount) || 0);
  return round2(subtotal + service);
}

/** JSON-safe money amount (avoids 10.100000000000001 payloads). */
export function toPayAmountPayload(value) {
  return Number(round2(value).toFixed(2));
}
