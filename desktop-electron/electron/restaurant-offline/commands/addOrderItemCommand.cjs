/**
 * C2 — add item to local order. TX: order_items + orders ACTIVE + outbox.
 * Missing shell (server order after WAN drop): materialize then add.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function materializeOrderShell(db, input, clock) {
  const orderId = String(input.orderId || '').trim();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (existing) return existing;
  if (input.storeId == null) throw new Error(`order_not_found:${orderId}`);
  const at = clock();
  db.prepare(
    `INSERT INTO orders(
       id, server_id, store_id, table_id, status, guest_count,
       waiter_id, waiter_name, opened_at, updated_at, payload_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    orderId,
    input.serverId != null ? String(input.serverId) : orderId,
    input.storeId,
    input.tableId != null ? String(input.tableId) : null,
    ORDER_STATUS.OPEN,
    Math.max(1, Number(input.guestCount) || 1),
    input.waiterId || null,
    input.waiterName || null,
    at,
    at,
    JSON.stringify({
      channel: input.channel || 'DINE_IN',
      tableCode: input.tableLabel || null,
      mirrored: true,
    }),
  );
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

function addOrderItemCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  const name = String(input?.name || '').trim();
  const quantity = Number(input?.quantity ?? input?.qty);
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');
  if (!name) throw new Error('item_name_required');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('item_qty_invalid');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    let existing = orders.getById(orderId);
    if (!existing) {
      existing = materializeOrderShell(db, input, clock);
    }
    if (existing.status === ORDER_STATUS.OPEN) {
      orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
    } else if (existing.status !== ORDER_STATUS.ACTIVE) {
      throw new Error(`order_not_active:${existing.status}`);
    }

    const item = items.insert({
      orderId,
      name,
      quantity,
      unitPrice: Number(input.unitPrice) || 0,
      menuItemId: input.menuItemId != null ? String(input.menuItemId) : null,
      portionText: input.portionText || null,
      note: input.note || null,
      modifiers: input.modifiers || null,
      status: 'OPEN',
    });

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_ADD_ITEM',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        itemId: item.id,
        menuItemId: item.menuItemId,
        name,
        quantity,
        unitPrice: Number(input.unitPrice) || 0,
        note: input.note || null,
        modifiers: input.modifiers || [],
      },
    });

    return {
      orderId,
      itemId: item.id,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { addOrderItemCommand };
