/**
 * Hub read model for peer terminals / waiter phones (floor + open orders + menu).
 */
const {
  listLocalMenuItems,
  listLocalMenuCategories,
  listLocalFloorSnapshot,
} = require('../commands/listLocalCatalog.cjs');

function parseJson(raw) {
  try {
    return JSON.parse(raw || '{}') || {};
  } catch {
    return {};
  }
}

function listOpenOrdersWithItems(db, storeId) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) return [];
  const orders = db.prepare(
    `SELECT * FROM orders WHERE store_id = ? AND status IN ('OPEN', 'ACTIVE', 'BILLING')
     ORDER BY updated_at DESC`,
  ).all(sid);
  const itemStmt = db.prepare(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
  );
  return orders.map((o) => {
    const meta = parseJson(o.payload_json);
    const items = itemStmt.all(o.id).map((it) => {
      const qty = Number(it.quantity) || 0;
      const storedSent = Number(it.sent_quantity);
      const sentQuantity = Number.isFinite(storedSent) && storedSent >= 0
        ? Math.min(storedSent, qty)
        : (it.status === 'SENT' ? qty : 0);
      return {
        id: it.id,
        menuItemId: it.menu_item_id,
        name: it.name,
        quantity: qty,
        unitPrice: it.unit_price,
        status: it.status,
        sentQuantity,
        note: it.note,
        modifiers: it.modifiers_json ? parseJson(it.modifiers_json) : null,
        portionText: it.portion_text,
        createdAt: it.created_at,
        updatedAt: it.updated_at,
      };
    });
    const subtotal = items.reduce((s, it) => (
      it.status === 'CANCELLED' ? s : s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
    ), 0);
    return {
      id: o.id,
      storeId: o.store_id,
      tableId: o.table_id,
      status: o.status === 'ACTIVE' ? 'OPEN' : o.status,
      guestCount: o.guest_count,
      waiterId: o.waiter_id,
      waiterName: o.waiter_name,
      openedAt: o.opened_at,
      updatedAt: o.updated_at,
      subtotal,
      payload: meta,
      items,
    };
  });
}

function buildHubSnapshot(db, storeId) {
  const sid = Number(storeId);
  return {
    storeId: Number.isFinite(sid) ? sid : null,
    at: new Date().toISOString(),
    floor: listLocalFloorSnapshot(db, sid),
    orders: listOpenOrdersWithItems(db, sid),
    menuItems: listLocalMenuItems(db, sid),
    menuCategories: listLocalMenuCategories(db, sid),
  };
}

module.exports = { buildHubSnapshot, listOpenOrdersWithItems };
