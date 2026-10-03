/**
 * Paint local-first orders (waiter IDB) onto a server/hub floor snapshot.
 *
 * Rules:
 * - Never hide a server check behind a local ghost (server activeOrders stay primary).
 * - Empty local OPEN shells do not mark a free table occupied.
 * - Local-only checks append / fill FREE tables so the waiter can reopen before WAN sync.
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

function toActiveRow(o) {
  return {
    id: o.id,
    status: uiStatus(o.status),
    guestCount: o.guestCount || 1,
    openedAt: o.openedAt || null,
    waiterUserId: o.waiterId || o.waiterUserId || null,
    subtotal: o.subtotal,
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
    // Empty OPEN shell (opened then left) must not paint the whole floor red.
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
      const localExtras = locals
        .filter((o) => !serverIds.has(String(o.id)))
        .map(toActiveRow);

      // Server already owns the table — keep its primary check; only append unsynced locals.
      if (serverChecks.length) {
        const activeOrders = [...serverChecks, ...localExtras];
        return {
          ...table,
          activeOrder: activeOrders[0] || table.activeOrder || null,
          activeOrderId: activeOrders[0]?.id ?? table.activeOrderId ?? null,
          activeOrders,
        };
      }

      // FREE on server: local unsynced check makes it OCCUPIED for this waiter device.
      const activeOrders = localExtras.length
        ? localExtras
        : locals.map(toActiveRow);
      const primary = activeOrders[0];
      if (!primary) return table;
      return {
        ...table,
        status: primary.status === 'BILLING' ? 'BILLING' : 'OCCUPIED',
        activeOrder: primary,
        activeOrderId: primary.id,
        activeOrders,
      };
    }),
  }));

  return { ...snapshot, halls };
}
