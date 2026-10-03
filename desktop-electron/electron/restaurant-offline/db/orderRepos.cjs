const { randomUUID } = require('node:crypto');
const { ORDER_STATUS, assertOrderTransition } = require('../domain/orderStatus.cjs');

function nowIso(clock = () => new Date().toISOString()) {
  return clock();
}

function createOrderRepo(db, { idFactory = randomUUID, clock = () => new Date().toISOString() } = {}) {
  return {
    insertOpen({ storeId, tableId, waiterId = null, waiterName = null, guestCount = 1 }) {
      const id = idFactory();
      const at = nowIso(clock);
      db.prepare(
        `INSERT INTO orders(id, store_id, table_id, status, guest_count, waiter_id, waiter_name, opened_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        storeId,
        tableId || null,
        ORDER_STATUS.OPEN,
        guestCount,
        waiterId,
        waiterName,
        at,
        at,
      );
      return { id, status: ORDER_STATUS.OPEN, openedAt: at };
    },

    getById(orderId) {
      return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) || null;
    },

    transitionStatus(orderId, toStatus) {
      const row = this.getById(orderId);
      if (!row) throw new Error(`order_not_found:${orderId}`);
      assertOrderTransition(row.status, toStatus);
      const at = nowIso(clock);
      const closedAt = toStatus === ORDER_STATUS.PAID || toStatus === ORDER_STATUS.CANCELLED ? at : null;
      db.prepare(
        `UPDATE orders SET status = ?, updated_at = ?, closed_at = COALESCE(?, closed_at) WHERE id = ?`,
      ).run(toStatus, at, closedAt, orderId);
      return { id: orderId, status: toStatus, updatedAt: at };
    },
  };
}

function createOrderItemRepo(db, { idFactory = randomUUID, clock = () => new Date().toISOString() } = {}) {
  return {
    insert({
      orderId,
      name,
      quantity,
      unitPrice = 0,
      menuItemId = null,
      portionText = null,
      note = null,
      modifiers = null,
      status = 'OPEN',
      id: idOverride = null,
    }) {
      const id = idOverride ? String(idOverride) : idFactory();
      const at = nowIso(clock);
      const sentQuantity = status === 'SENT' ? (Number(quantity) || 0) : 0;
      db.prepare(
        `INSERT INTO order_items(
           id, order_id, menu_item_id, name, quantity, unit_price, status,
           portion_text, note, modifiers_json, sent_quantity, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        orderId,
        menuItemId,
        name,
        quantity,
        unitPrice,
        status,
        portionText,
        note,
        modifiers != null ? JSON.stringify(modifiers) : null,
        sentQuantity,
        at,
        at,
      );
      return { id, orderId, name, quantity, status, sentQuantity };
    },

    markSent(itemId) {
      const row = this.getById(itemId);
      if (!row) throw new Error(`item_not_found:${itemId}`);
      if (row.status === 'CANCELLED') return row;
      const at = nowIso(clock);
      const qty = Number(row.quantity) || 0;
      // OPEN→SENT, or SENT with extra unsent qty after merge — lock baseline to full qty.
      db.prepare(
        `UPDATE order_items SET status = ?, sent_quantity = ?, sent_at = COALESCE(sent_at, ?), updated_at = ? WHERE id = ?`,
      ).run('SENT', qty, at, at, itemId);
      return this.getById(itemId);
    },

    listByOrder(orderId) {
      return db.prepare(
        `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
      ).all(orderId);
    },

    getById(itemId) {
      return db.prepare(`SELECT * FROM order_items WHERE id = ?`).get(itemId) || null;
    },

    updateQuantity(itemId, quantity, note) {
      const row = this.getById(itemId);
      if (!row) throw new Error(`item_not_found:${itemId}`);
      const at = nowIso(clock);
      const nextNote = note !== undefined ? note : row.note;
      db.prepare(
        `UPDATE order_items SET quantity = ?, note = ?, updated_at = ? WHERE id = ?`,
      ).run(quantity, nextNote, at, itemId);
      return this.getById(itemId);
    },

    markCancelled(itemId) {
      const row = this.getById(itemId);
      if (!row) throw new Error(`item_not_found:${itemId}`);
      if (row.status === 'CANCELLED') return row;
      const at = nowIso(clock);
      db.prepare(
        `UPDATE order_items SET status = ?, updated_at = ? WHERE id = ?`,
      ).run('CANCELLED', at, itemId);
      return this.getById(itemId);
    },

    delete(itemId) {
      db.prepare(`DELETE FROM order_items WHERE id = ?`).run(itemId);
    },
  };
}

module.exports = {
  createOrderRepo,
  createOrderItemRepo,
};
