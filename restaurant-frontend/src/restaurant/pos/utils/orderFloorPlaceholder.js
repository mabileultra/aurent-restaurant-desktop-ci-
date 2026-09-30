import { tableActiveOrders } from './floorStatusFilters';

/** Find active-order summary on the floor snapshot for instant dock UI. */
export function findFloorOrderContext(halls, orderId) {
  if (orderId == null) return null;
  const want = String(orderId);
  for (const hall of halls || []) {
    for (const table of hall.tables || []) {
      const hit = tableActiveOrders(table).find((row) => String(row?.id) === want);
      if (hit) {
        return { table, summary: hit, hallName: hall.name || null };
      }
    }
  }
  return null;
}

/** Minimal order shape so the dock/header paints before GET /orders/{id}. */
export function orderPlaceholderFromFloor(halls, orderId) {
  const ctx = findFloorOrderContext(halls, orderId);
  if (!ctx) return undefined;
  const { table, summary } = ctx;
  return {
    id: summary.id,
    orderNo: summary.orderNo,
    status: summary.status,
    channel: 'DINE_IN',
    tableId: table.id,
    tableCode: table.code,
    guestCount: summary.guestCount ?? 1,
    adultCount: summary.adultCount ?? summary.guestCount ?? 1,
    childrenCount: summary.childrenCount ?? 0,
    subtotal: summary.subtotal ?? 0,
    discountAmount: 0,
    waiterUserId: summary.waiterUserId ?? null,
    openedAt: summary.openedAt ?? null,
    items: [],
    _fromFloor: true,
  };
}
