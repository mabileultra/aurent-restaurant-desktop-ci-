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

    const menuItemId = input.menuItemId != null ? String(input.menuItemId) : null;
    const note = input.note || null;
    const modifiers = input.modifiers || null;
    const modsJson = modifiers != null ? JSON.stringify(modifiers) : null;
    const unitPrice = Number(input.unitPrice) || 0;

    const openRows = items.listByOrder(orderId).filter((row) => row.status === 'OPEN');
    const mergeRow = openRows.find((row) => (
      String(row.menu_item_id || '') === String(menuItemId || '')
      && String(row.name || '') === name
      && String(row.note || '') === String(note || '')
      && String(row.modifiers_json || '') === String(modsJson || '')
    ));

    if (mergeRow) {
      const nextQty = (Number(mergeRow.quantity) || 0) + quantity;
      items.updateQuantity(mergeRow.id, nextQty, note);
      const event = outbox.enqueue({
        deviceId,
        eventType: 'ORDER_UPDATE_ITEM',
        clientEventId: input.clientEventId || null,
        payload: {
          orderId,
          itemId: mergeRow.id,
          quantity: nextQty,
          note,
        },
      });
      return {
        orderId,
        itemId: mergeRow.id,
        outboxId: event.id,
        clientEventId: event.clientEventId,
        merged: true,
        order: toUiOrder(db, orderId),
      };
    }

    const item = items.insert({
      orderId,
      name,
      quantity,
      unitPrice,
      menuItemId,
      portionText: input.portionText || null,
      note,
      modifiers,
      status: 'OPEN',
      // Waiter phone item id — keep stable so SEND can mark SENT without duplicating.
      id: input.itemId || null,
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
        unitPrice,
        note,
        modifiers: modifiers || [],
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
