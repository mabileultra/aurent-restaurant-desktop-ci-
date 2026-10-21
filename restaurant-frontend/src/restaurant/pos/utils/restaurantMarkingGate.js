export const MARKING_NO_INTEGRATION = 'MARKING_NO_INTEGRATION';

export function isMarkedOrderLine(item) {
  if (!item?.markedProduct) return false;
  return String(item.itemStatus || '').toUpperCase() !== 'CANCELLED';
}

export function orderHasMarkedLines(order) {
  return (order?.items || []).some(isMarkedOrderLine);
}

export function markingNoIntegrationError() {
  const err = new Error(MARKING_NO_INTEGRATION);
  err.code = MARKING_NO_INTEGRATION;
  return err;
}
