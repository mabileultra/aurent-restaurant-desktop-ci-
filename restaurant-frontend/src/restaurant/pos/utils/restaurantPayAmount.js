import { round2 } from '../../../utils/taxAmounts';

function dineIn(order) {
  return (order?.channel || 'DINE_IN') === 'DINE_IN';
}

/**
 * Service the guest pays. Snapshotted percent wins. Otherwise the table's own
 * percent, otherwise the hall percent.
 */
export function resolveServicePreview(order, halls = []) {
  if (!order || !dineIn(order)) return { percent: 0, amount: 0 };
  const subtotal = round2(Number(order.subtotal) || 0);
  if (order.servicePercent != null && order.servicePercent !== '') {
    const percent = Number(order.servicePercent) || 0;
    return { percent, amount: round2((subtotal * percent) / 100) };
  }
  const billed = order.status === 'BILLING' || order.status === 'CLOSED';
  if (billed && order.commissionAmount != null) {
    return {
      percent: Number(order.commissionPercent) || 0,
      amount: round2(Number(order.commissionAmount) || 0),
    };
  }
  let percent = 0;
  for (const hall of halls || []) {
    const table = (hall.tables || []).find((row) => row.id === order.tableId);
    if (!table) continue;
    const own = table.servicePercent != null && table.servicePercent !== '';
    percent = own ? Number(table.servicePercent) || 0 : Number(hall.servicePercent) || 0;
    break;
  }
  return { percent, amount: round2((subtotal * percent) / 100) };
}

/** Sum the cashier must charge: dishes + service − discount. */
export function resolveRestaurantPayTotal(order, servicePreview = null) {
  if (!order) return 0;
  const subtotal = round2(Number(order.subtotal) || 0);
  const discount = round2(Math.max(0, Number(order.discountAmount) || 0));
  if (!dineIn(order)) return round2(Math.max(0, subtotal - discount));
  const service = servicePreview
    ? round2(Number(servicePreview.amount) || 0)
    : round2(Number(order.serviceAmount ?? order.commissionAmount) || 0);
  return round2(Math.max(0, subtotal + service - discount));
}

/** JSON-safe money amount (avoids 10.100000000000001 payloads). */
export function toPayAmountPayload(value) {
  return Number(round2(value).toFixed(2));
}
