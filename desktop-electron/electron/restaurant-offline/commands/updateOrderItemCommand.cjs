/**
 * Update local order item qty/note. TX: order_items + outbox.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS, isTerminalOrder } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function updateOrderItemCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  const itemId = String(input?.itemId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');
  if (!itemId) throw new Error('item_id_required');

  const quantity = input.quantity != null ? Number(input.quantity) : null;
  if (quantity != null && (!Number.isFinite(quantity) || quantity <= 0)) {
    throw new Error('item_qty_invalid');
  }

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (isTerminalOrder(order.status)) throw new Error(`order_terminal:${order.status}`);

    const item = items.getById(itemId);
    if (!item || item.order_id !== orderId) throw new Error(`item_not_found:${itemId}`);
    if (item.status === 'CANCELLED') throw new Error('item_cancelled');

    const nextQty = quantity != null ? quantity : Number(item.quantity);
    const note = input.note !== undefined ? (input.note || null) : undefined;
    items.updateQuantity(itemId, nextQty, note);

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_UPDATE_ITEM',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        itemId,
        quantity: nextQty,
        note: note !== undefined ? note : item.note,
      },
    });

    return {
      orderId,
      itemId,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { updateOrderItemCommand };
