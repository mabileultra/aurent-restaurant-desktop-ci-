/**
 * Mark local order paid. TX: orders PAID + outbox ORDER_PAY.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS, isTerminalOrder } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function payOrderCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('pay_amount_invalid');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (order.status === ORDER_STATUS.PAID) {
      return {
        orderId,
        already: true,
        status: ORDER_STATUS.PAID,
        order: toUiOrder(db, orderId),
      };
    }
    if (isTerminalOrder(order.status)) {
      throw new Error(`order_terminal:${order.status}`);
    }
    if (order.status === ORDER_STATUS.OPEN) {
      orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
    }
    orders.transitionStatus(orderId, ORDER_STATUS.PAID);

    const method = String(input.method || 'CASH').toUpperCase();
    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_PAY',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        method,
        amount,
        cashAmount: Number(input.cashAmount) || 0,
        cardAmount: Number(input.cardAmount) || 0,
        amountTendered: Number(input.amountTendered ?? amount) || amount,
        changeGiven: Number(input.changeGiven) || 0,
        cardType: input.cardType || null,
        debtPhone: input.debtPhone || null,
        debtComment: input.debtComment || null,
        advancePaid: input.advancePaid != null ? Number(input.advancePaid) : null,
        tableId: order.table_id,
      },
    });

    return {
      orderId,
      status: ORDER_STATUS.PAID,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { payOrderCommand };
