/**
 * Cancel/remove local order item. TX: order_items + outbox.
 * NEW/OPEN → delete; SENT → mark CANCELLED.
 */
const { randomUUID } = require('node:crypto');
const { isTerminalOrder } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function cancelOrderItemCommand(db, input, deps = {}) {
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

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (isTerminalOrder(order.status)) throw new Error(`order_terminal:${order.status}`);

    const item = items.getById(itemId);
    if (!item || item.order_id !== orderId) throw new Error(`item_not_found:${itemId}`);
    if (item.status === 'CANCELLED') {
      return {
        orderId,
        itemId,
        deleted: false,
        already: true,
        order: toUiOrder(db, orderId),
      };
    }

    const deleted = item.status === 'OPEN' || item.status === 'NEW';
    if (deleted) items.delete(itemId);
    else items.markCancelled(itemId);

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_CANCEL_ITEM',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        itemId,
        deleted,
      },
    });

    return {
      orderId,
      itemId,
      deleted,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { cancelOrderItemCommand };
