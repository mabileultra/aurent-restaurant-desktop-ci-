const COOKING_STATUSES = new Set(['NEW', 'ACCEPTED', 'PREPARING']);

function orderKey(ticket) {
  if (ticket?.orderId != null) return String(ticket.orderId);
  if (ticket?.orderNo != null) return `no:${ticket.orderNo}`;
  return ticket?.id != null ? String(ticket.id) : null;
}

function sortByOrderNo(a, b) {
  const na = Number(a.orderNo);
  const nb = Number(b.orderNo);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return String(a.orderNo ?? '').localeCompare(String(b.orderNo ?? ''), undefined, { numeric: true });
}

/**
 * TV board: one number per order.
 * Left = still cooking; right = fully ready (no cooking tickets left).
 */
export function groupReadyDisplayOrders(tickets) {
  const byOrder = new Map();

  for (const ticket of tickets ?? []) {
    if (!ticket || ticket.status === 'CANCELLED' || ticket.status === 'SERVED') continue;
    const key = orderKey(ticket);
    if (!key) continue;

    let row = byOrder.get(key);
    if (!row) {
      row = {
        key,
        orderId: ticket.orderId ?? null,
        orderNo: ticket.orderNo ?? '—',
        tableCode: ticket.tableCode ?? null,
        channel: ticket.channel || 'DINE_IN',
        cooking: false,
        ready: false,
      };
      byOrder.set(key, row);
    }

    if (COOKING_STATUSES.has(ticket.status)) row.cooking = true;
    if (ticket.status === 'READY') row.ready = true;
    if (ticket.tableCode && !row.tableCode) row.tableCode = ticket.tableCode;
  }

  const cooking = [];
  const ready = [];
  for (const row of byOrder.values()) {
    if (row.cooking) cooking.push(row);
    else if (row.ready) ready.push(row);
  }

  cooking.sort(sortByOrderNo);
  ready.sort(sortByOrderNo);
  return { cooking, ready };
}
