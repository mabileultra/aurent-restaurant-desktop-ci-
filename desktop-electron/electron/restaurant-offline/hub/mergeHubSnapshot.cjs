/**
 * Merge hub snapshot open orders into local SQLite (peer terminal floor sync).
 * Does not overwrite local orders that are newer (by updated_at).
 */
const { ORDER_STATUS } = require('../domain/orderStatus.cjs');

function parseIso(v) {
  const t = Date.parse(String(v || ''));
  return Number.isFinite(t) ? t : 0;
}

function upsertOrder(db, order, storeId, at) {
  const id = String(order.id || '').trim();
  if (!id) return false;
  const existing = db.prepare(`SELECT id, updated_at FROM orders WHERE id = ?`).get(id);
  if (existing && parseIso(existing.updated_at) > parseIso(order.updatedAt)) {
    return false;
  }
  const statusRaw = String(order.status || ORDER_STATUS.OPEN).toUpperCase();
  const status = statusRaw === 'OPEN' ? ORDER_STATUS.OPEN
    : (statusRaw === 'BILLING' ? ORDER_STATUS.BILLING : statusRaw);
  const payload = order.payload && typeof order.payload === 'object'
    ? order.payload
    : {};
  if (existing) {
    db.prepare(
      `UPDATE orders SET store_id=?, table_id=?, status=?, guest_count=?, waiter_id=?, waiter_name=?,
       updated_at=?, payload_json=? WHERE id=?`,
    ).run(
      storeId,
      order.tableId != null ? String(order.tableId) : null,
      status,
      Math.max(1, Number(order.guestCount) || 1),
      order.waiterId || null,
      order.waiterName || null,
      order.updatedAt || at,
      JSON.stringify(payload),
      id,
    );
  } else {
    db.prepare(
      `INSERT INTO orders(
         id, server_id, store_id, table_id, status, guest_count,
         waiter_id, waiter_name, opened_at, updated_at, payload_json
       ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      storeId,
      order.tableId != null ? String(order.tableId) : null,
      status,
      Math.max(1, Number(order.guestCount) || 1),
      order.waiterId || null,
      order.waiterName || null,
      order.openedAt || at,
      order.updatedAt || at,
      JSON.stringify(payload),
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(id);
  const ins = db.prepare(
    `INSERT INTO order_items(
       id, order_id, menu_item_id, name, quantity, unit_price, status,
       portion_text, note, modifiers_json, sent_quantity, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const it of items) {
    const itemId = String(it.id || '').trim();
    if (!itemId) continue;
    const qty = Number(it.quantity) || 1;
    const status = String(it.status || 'OPEN');
    const storedSent = Number(it.sentQuantity ?? it.sent_quantity);
    const sentQuantity = Number.isFinite(storedSent) && storedSent >= 0
      ? Math.min(storedSent, qty)
      : (status === 'SENT' ? qty : 0);
    ins.run(
      itemId,
      id,
      it.menuItemId != null ? String(it.menuItemId) : null,
      String(it.name || ''),
      qty,
      Number(it.unitPrice) || 0,
      status,
      it.portionText || null,
      it.note || null,
      it.modifiers != null ? JSON.stringify(it.modifiers) : null,
      sentQuantity,
      it.createdAt || at,
      it.updatedAt || at,
    );
  }
  return true;
}

function mergeMenuFromSnapshot(db, storeId, menuItems, menuCategories, at) {
  const cats = Array.isArray(menuCategories) ? menuCategories : [];
  const items = Array.isArray(menuItems) ? menuItems : [];
  const insCat = db.prepare(
    `INSERT OR REPLACE INTO menu_categories(
       id, server_id, store_id, name, sort_order, auto_print, print_printer_name, active, payload_json, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  );
  for (const row of cats) {
    const id = String(row.id ?? '');
    if (!id) continue;
    insCat.run(
      id,
      Number.isFinite(Number(row.id)) ? Number(row.id) : null,
      storeId,
      String(row.name || ''),
      Number(row.sortOrder) || 100,
      row.autoPrint ? 1 : 0,
      row.printPrinterName || null,
      JSON.stringify(row),
      at,
    );
  }
  const insItem = db.prepare(
    `INSERT OR REPLACE INTO menu_items(
       id, server_id, store_id, category_id, name, price, active, payload_json, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  );
  for (const row of items) {
    const id = String(row.id ?? '');
    if (!id) continue;
    insItem.run(
      id,
      Number.isFinite(Number(row.id)) ? Number(row.id) : null,
      storeId,
      row.categoryId != null ? String(row.categoryId) : null,
      String(row.name || ''),
      Number(row.price ?? row.sellingPrice) || 0,
      JSON.stringify(row),
      at,
    );
  }
}

/**
 * @returns {{ mergedOrders: number, menuItems: number, menuCategories: number }}
 */
function mergeHubSnapshot(db, snapshot = {}) {
  const storeId = Number(snapshot.storeId);
  if (!Number.isFinite(storeId)) throw new Error('store_id_required');
  const at = String(snapshot.at || new Date().toISOString());
  const orders = Array.isArray(snapshot.orders) ? snapshot.orders : [];
  let mergedOrders = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const order of orders) {
      if (upsertOrder(db, order, storeId, at)) mergedOrders += 1;
    }
    mergeMenuFromSnapshot(db, storeId, snapshot.menuItems, snapshot.menuCategories, at);
    db.exec('COMMIT');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw err;
  }
  return {
    mergedOrders,
    menuItems: Array.isArray(snapshot.menuItems) ? snapshot.menuItems.length : 0,
    menuCategories: Array.isArray(snapshot.menuCategories) ? snapshot.menuCategories.length : 0,
  };
}

module.exports = { mergeHubSnapshot };
