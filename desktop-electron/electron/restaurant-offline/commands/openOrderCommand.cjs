/**
 * C1 — open table/order locally. TX: orders + outbox (no print).
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');

function openOrderCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (input?.storeId == null) throw new Error('store_id_required');
  const tableId = input.tableId != null ? String(input.tableId) : null;
  if (!tableId && !input.allowNoTable) throw new Error('table_id_required');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const at = clock();
    const orderId = input.orderId ? String(input.orderId) : idFactory();
    const guestCount = Math.max(1, Number(input.guestCount) || 1);

    const existing = orders.getById(orderId);
    if (!existing) {
      db.prepare(
        `INSERT INTO orders(
           id, server_id, store_id, table_id, status, guest_count,
           waiter_id, waiter_name, opened_at, updated_at, payload_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        orderId,
        input.serverId || null,
        input.storeId,
        tableId,
        ORDER_STATUS.OPEN,
        guestCount,
        input.waiterId || null,
        input.waiterName || null,
        at,
        at,
        JSON.stringify({
          adultCount: input.adultCount ?? guestCount,
          childrenCount: input.childrenCount ?? 0,
          comment: input.comment || null,
          tableCode: input.tableLabel || null,
          channel: input.channel || 'DINE_IN',
          clientName: input.clientName || null,
          clientPhone: input.clientPhone || null,
          deliveryAddress: input.deliveryAddress || null,
        }),
      );
    }

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_OPEN',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        storeId: input.storeId,
        tableId,
        guestCount,
        adultCount: input.adultCount ?? guestCount,
        childrenCount: input.childrenCount ?? 0,
        waiterId: input.waiterId || null,
        tableLabel: input.tableLabel || null,
        channel: input.channel || 'DINE_IN',
        comment: input.comment || null,
      },
    });

    const row = orders.getById(orderId);
    return {
      orderId,
      status: row.status,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      openedAt: row.opened_at,
      tableId,
      guestCount,
    };
  });
}

function toUiOrder(db, orderId) {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return null;
  const items = db.prepare(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
  ).all(orderId);
  let meta = {};
  try {
    meta = JSON.parse(order.payload_json || '{}');
  } catch {
    meta = {};
  }
  return {
    id: order.id,
    orderNo: order.server_id || `L-${String(order.id).slice(0, 8)}`,
    // POS flags expect OPEN/BILLING; local lifecycle ACTIVE ≡ open check with items.
    status: order.status === 'ACTIVE' ? 'OPEN' : order.status,
    channel: meta.channel || 'DINE_IN',
    tableId: order.table_id,
    tableCode: meta.tableCode || null,
    guestCount: order.guest_count,
    adultCount: meta.adultCount ?? order.guest_count,
    childrenCount: meta.childrenCount ?? 0,
    subtotal: items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0),
    discountAmount: Number(meta.discountAmount) || 0,
    waiterUserId: order.waiter_id,
    openedAt: order.opened_at,
    _local: true,
    items: items.map((i) => {
      let modifiers = [];
      try {
        modifiers = JSON.parse(i.modifiers_json || '[]');
      } catch {
        modifiers = [];
      }
      const qty = Number(i.quantity) || 0;
      const storedSent = Number(i.sent_quantity);
      const sentQuantity = Number.isFinite(storedSent) && storedSent >= 0
        ? Math.min(storedSent, qty)
        : (i.status === 'SENT' ? qty : 0);
      return {
        id: i.id,
        menuItemId: i.menu_item_id,
        name: i.name,
        quantity: qty,
        sentQuantity,
        unitPrice: i.unit_price,
        lineTotal: Math.round(qty * (Number(i.unit_price) || 0) * 100) / 100,
        itemStatus:
          i.status === 'CANCELLED'
            ? 'CANCELLED'
            : (i.status === 'SENT' || sentQuantity > 0)
              ? 'SENT_TO_KITCHEN'
              : 'NEW',
        portionText: i.portion_text,
        note: i.note,
        modifiers,
      };
    }),
  };
}

module.exports = { openOrderCommand, toUiOrder };
