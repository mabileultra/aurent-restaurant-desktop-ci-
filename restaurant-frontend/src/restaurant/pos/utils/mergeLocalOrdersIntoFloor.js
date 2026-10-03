/**
 * Paint local-first orders (waiter IDB / satellite) onto a server or hub floor snapshot
 * so tables stay OCCUPIED after punch even before outbox sync.
 */

function uiStatus(status) {
  if (status === 'BILLING') return 'BILLING';
  if (status === 'ACTIVE') return 'OPEN';
  return status || 'OPEN';
}

function tableKey(id) {
  return id == null ? '' : String(id);
}

/**
 * @param {{ storeId?: *, halls?: object[] }|null} snapshot
 * @param {object[]} localOrders — open/active/billing rows with tableId
 */
export function mergeLocalOrdersIntoFloor(snapshot, localOrders = []) {
  if (!snapshot?.halls?.length) return snapshot || { storeId: null, halls: [] };
  const open = (Array.isArray(localOrders) ? localOrders : []).filter((o) => {
    const st = String(o?.status || '');
    return st === 'OPEN' || st === 'ACTIVE' || st === 'BILLING';
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
      const primary = locals[0];
      const activeOrders = [
        ...locals.map((o) => ({
          id: o.id,
          status: uiStatus(o.status),
          guestCount: o.guestCount || 1,
          openedAt: o.openedAt || null,
          waiterUserId: o.waiterId || o.waiterUserId || null,
        })),
        ...(Array.isArray(table.activeOrders) ? table.activeOrders.filter(
          (ao) => !locals.some((o) => String(o.id) === String(ao?.id)),
        ) : []),
      ];
      const status = primary.status === 'BILLING' ? 'BILLING' : 'OCCUPIED';
      return {
        ...table,
        status,
        activeOrder: activeOrders[0] || table.activeOrder || null,
        activeOrderId: activeOrders[0]?.id ?? table.activeOrderId ?? null,
        activeOrders,
      };
    }),
  }));

  return { ...snapshot, halls };
}
