/**
 * C2 — add item to local order. TX: order_items + orders ACTIVE + outbox.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS } = require('../domain/orderStatus.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

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

    const existing = orders.getById(orderId);
    if (!existing) throw new Error(`order_not_found:${orderId}`);
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
