/**
 * Returnable dish lines for restaurant paid-order refund UI.
 */

export function returnableQty(line) {
  if (line?.isServiceLine) return 0;
  if (line?.returnableQuantity != null) return Number(line.returnableQuantity) || 0;
  const sold = Number(line?.quantity) || 0;
  const returned = Number(line?.returnedQuantity) || 0;
  return Math.max(0, sold - returned);
}

export function getReturnableLines(sale) {
  return (sale?.items ?? []).filter((line) => !line.isServiceLine && returnableQty(line) > 0);
}

export function buildRstReturnPayload(sale, qtyByItemId, reason) {
  const lines = (sale?.items ?? [])
    .filter((line) => line.id && !line.isServiceLine && (qtyByItemId[line.id] ?? 0) > 0)
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
