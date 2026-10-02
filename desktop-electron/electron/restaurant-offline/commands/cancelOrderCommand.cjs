/**
 * Cancel whole local order. TX: orders CANCELLED + items + outbox.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS, isTerminalOrder } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function cancelOrderCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (isTerminalOrder(order.status)) {
      return {
        orderId,
        already: true,
        status: order.status,
        order: toUiOrder(db, orderId),
      };
    }

    // OPEN → CANCELLED allowed; ACTIVE → CANCELLED allowed.
    if (order.status === ORDER_STATUS.OPEN) {
      orders.transitionStatus(orderId, ORDER_STATUS.CANCELLED);
    } else {
      orders.transitionStatus(orderId, ORDER_STATUS.CANCELLED);
    }

    for (const item of items.listByOrder(orderId)) {
      if (item.status !== 'CANCELLED') items.markCancelled(item.id);
    }

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_CANCEL',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        tableId: order.table_id,
      },
    });

    return {
      orderId,
      status: ORDER_STATUS.CANCELLED,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { cancelOrderCommand };
