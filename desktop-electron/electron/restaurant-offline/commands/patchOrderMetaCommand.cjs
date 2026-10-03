/**
 * Patch local order meta: guests / discount / waiter. TX + outbox.
 */
const { randomUUID } = require('node:crypto');
const { isTerminalOrder } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function parseMeta(row) {
  try {
    return JSON.parse(row.payload_json || '{}') || {};
  } catch {
    return {};
  }
}

function patchOrderMetaCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  const patch = String(input?.patch || '').trim().toUpperCase();
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');
  if (!['GUESTS', 'DISCOUNT', 'WAITER'].includes(patch)) {
    throw new Error(`patch_unsupported:${patch}`);
  }

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (isTerminalOrder(order.status)) throw new Error(`order_terminal:${order.status}`);

    const meta = parseMeta(order);
    const at = clock();
    let eventType = 'ORDER_UPDATE_GUESTS';
    let payload = { orderId };

    if (patch === 'GUESTS') {
      const guestCount = Math.max(1, Number(input.guestCount) || 1);
      const childrenCount = Math.min(
        guestCount,
        Math.max(0, Number(input.childrenCount ?? meta.childrenCount ?? 0)),
      );
      const adultCount = Math.max(1, guestCount - childrenCount);
      meta.adultCount = adultCount;
      meta.childrenCount = childrenCount;
      db.prepare(
        `UPDATE orders SET guest_count = ?, payload_json = ?, updated_at = ? WHERE id = ?`,
      ).run(guestCount, JSON.stringify(meta), at, orderId);
      eventType = 'ORDER_UPDATE_GUESTS';
      payload = { orderId, guestCount, adultCount, childrenCount };
    } else if (patch === 'DISCOUNT') {
      const discountAmount = Math.max(0, Number(input.discountAmount) || 0);
      meta.discountAmount = discountAmount;
      db.prepare(
        `UPDATE orders SET payload_json = ?, updated_at = ? WHERE id = ?`,
      ).run(JSON.stringify(meta), at, orderId);
      eventType = 'ORDER_UPDATE_DISCOUNT';
      payload = { orderId, discountAmount };
    } else if (patch === 'WAITER') {
      const waiterId = input.waiterId != null ? String(input.waiterId) : null;
      const waiterName = input.waiterName || null;
      db.prepare(
        `UPDATE orders SET waiter_id = ?, waiter_name = ?, updated_at = ? WHERE id = ?`,
      ).run(waiterId, waiterName, at, orderId);
      eventType = 'ORDER_ASSIGN_WAITER';
      payload = { orderId, waiterId, waiterName };
    }

    const event = outbox.enqueue({
      deviceId,
      eventType,
      clientEventId: input.clientEventId || null,
      payload,
    });

    return {
      orderId,
      patch,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { patchOrderMetaCommand };
