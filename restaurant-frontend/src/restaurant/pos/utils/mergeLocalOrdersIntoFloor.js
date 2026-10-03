/**
 * Paint local-first orders (waiter IDB) onto a server/hub floor snapshot.
 *
 * Waiter phone: local check WITH lines is primary. Otherwise the floor shows the
 * empty server shell (0 ₽) and opens the wrong ticket after punch+send.
 */

function uiStatus(status) {
  if (status === 'BILLING') return 'BILLING';
  if (status === 'ACTIVE') return 'OPEN';
  return status || 'OPEN';
}

function tableKey(id) {
  return id == null ? '' : String(id);
}

function hasLines(order) {
  return Array.isArray(order?.items) && order.items.some((i) => {
    const st = String(i?.status || i?.itemStatus || '');
    return st !== 'CANCELLED';
  });
}

function lineMoney(item) {
  if (!item) return 0;
  const st = String(item.status || item.itemStatus || '');
  if (st === 'CANCELLED') return 0;
  const stored = Number(item.lineTotal);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
}

/** IDB rows have items[] but often no precomputed subtotal — floor cards showed 0. */
export function orderSubtotal(o) {
  const direct = Number(o?.subtotal);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return (Array.isArray(o?.items) ? o.items : []).reduce((sum, item) => sum + lineMoney(item), 0);
}

function toActiveRow(o) {
  return {
    id: o.id,
    status: uiStatus(o.status),
    guestCount: o.guestCount || 1,
    openedAt: o.openedAt || null,
    waiterUserId: o.waiterId || o.waiterUserId || null,
    subtotal: orderSubtotal(o),
    orderNo: o.orderNo || (o.id ? `L-${String(o.id).slice(0, 8)}` : null),
    _local: true,
  };
}

/**
 * @param {{ storeId?: *, halls?: object[] }|null} snapshot
 * @param {object[]} localOrders — open/active/billing rows with tableId
 */
export function mergeLocalOrdersIntoFloor(snapshot, localOrders = []) {
  if (!snapshot?.halls?.length) return snapshot || { storeId: null, halls: [] };
  const open = (Array.isArray(localOrders) ? localOrders : []).filter((o) => {
    const st = String(o?.status || '');
    if (st !== 'OPEN' && st !== 'ACTIVE' && st !== 'BILLING') return false;
    if (st === 'OPEN' && !hasLines(o)) return false;
    return true;
  });
  if (!open.length) return snapshot;

  /** @type {Map<string, object[]>} */
  const byTable = new Map();
  for (const order of open) {
    const key = tableKey(order.tableId);
    if (!key) continue;
    const list = byTable.get(key) || [];
    list.push(order);
    byTable.set(key, list);
  }
  if (!byTable.size) return snapshot;

  const halls = snapshot.halls.map((hall) => ({
    ...hall,
    tables: (hall.tables || []).map((table) => {
      const locals = byTable.get(tableKey(table.id))
        || byTable.get(tableKey(table.serverId))
        || [];
      if (!locals.length) return table;

      const serverChecks = Array.isArray(table.activeOrders) && table.activeOrders.length
        ? table.activeOrders
        : (table.activeOrder ? [table.activeOrder] : []);
      const serverIds = new Set(serverChecks.map((ao) => String(ao?.id)));

      const richLocals = locals
        .filter((o) => !serverIds.has(String(o.id)) && hasLines(o))
        .map(toActiveRow)
        .sort((a, b) => (Number(b.subtotal) || 0) - (Number(a.subtotal) || 0));
      const thinLocals = locals
        .filter((o) => !serverIds.has(String(o.id)) && !hasLines(o))
        .map(toActiveRow);

      // Local dish ticket first — avoids opening empty server check (0 ₽ / «чужой» счёт).
      const activeOrders = [];
      const seen = new Set();
      const push = (row) => {
        const id = String(row?.id || '');
        if (!id || seen.has(id)) return;
        seen.add(id);
        activeOrders.push(row);
      };
      richLocals.forEach(push);
      serverChecks.forEach(push);
      thinLocals.forEach(push);

      const primary = activeOrders[0];
      if (!primary) return table;

      const occupied = table.status === 'FREE' || richLocals.length > 0
        ? (primary.status === 'BILLING' ? 'BILLING' : 'OCCUPIED')
        : table.status;

      return {
        ...table,
        status: occupied,
        activeOrder: primary,
        activeOrderId: primary.id,
        activeOrders,
      };
    }),
  }));

  return { ...snapshot, halls };
}
