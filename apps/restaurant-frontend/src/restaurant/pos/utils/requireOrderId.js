/** Reject null / "null" / "undefined" before calling /orders/{id}/... */
export function isUsableOrderId(id) {
  if (id == null || id === '') return false;
  const s = String(id).trim();
  return s !== '' && s !== 'null' && s !== 'undefined';
}

export function requireOrderId(...candidates) {
  for (const id of candidates) {
    if (isUsableOrderId(id)) return id;
  }
  throw new Error('order_required');
}
