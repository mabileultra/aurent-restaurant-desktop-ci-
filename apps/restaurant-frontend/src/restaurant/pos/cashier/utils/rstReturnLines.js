/**
 * Returnable dish lines for restaurant paid-order refund UI.
 */

const ORDER_ITEM_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isOrderItemId(id) {
  return ORDER_ITEM_UUID.test(String(id || ''));
}

export function returnableQty(line) {
  if (line?.isServiceLine) return 0;
  if (!isOrderItemId(line?.id)) return 0;
  if (line?.returnableQuantity != null) return Number(line.returnableQuantity) || 0;
  const sold = Number(line?.quantity) || 0;
  const returned = Number(line?.returnedQuantity) || 0;
  return Math.max(0, sold - returned);
}

export function getReturnableLines(sale) {
  return (sale?.items ?? []).filter((line) => !line.isServiceLine && returnableQty(line) > 0);
}

export function buildRstReturnPayload(sale, qtyByItemId, reason) {
  const lines = getReturnableLines(sale)
    .filter((line) => (qtyByItemId[line.id] ?? 0) > 0)
    .map((line) => ({
      orderItemId: line.id,
      quantity: qtyByItemId[line.id],
    }));
  return { reason: reason?.trim() || '', lines };
}

export function selectedReturnTotal(sale, qtyByItemId) {
  return (sale?.items ?? []).reduce((sum, line) => {
    const q = qtyByItemId[line.id] ?? 0;
    if (q <= 0 || line.isServiceLine) return sum;
    const unit = Number(line.unitPrice) || 0;
    return sum + unit * q;
  }, 0);
}
