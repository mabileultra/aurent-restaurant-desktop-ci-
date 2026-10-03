/**
 * Waiter PWA local commands — IndexedDB TX + outbox (no local printer).
 * Kitchen print happens on server when outbox ORDER_SEND_KITCHEN has printOnServer.
 */

import { idbGet, idbGetAll, idbWriteAll, newId } from './idb';
import { getWaiterDeviceId } from './deviceId';

function nowIso() {
  return new Date().toISOString();
}

function toUiOrder(row) {
  if (!row) return null;
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.id,
    orderNo: row.orderNo || `L-${String(row.id).slice(0, 8)}`,
    status: row.status === 'ACTIVE' ? 'OPEN' : row.status,
    channel: row.channel || 'DINE_IN',
    tableId: row.tableId,
    tableCode: row.tableLabel || row.tableCode || null,
    guestCount: row.guestCount || 1,
    adultCount: row.adultCount ?? row.guestCount ?? 1,
    childrenCount: row.childrenCount ?? 0,
    subtotal: items.reduce(
      (s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0),
      0,
    ),
    discountAmount: row.discountAmount || 0,
    waiterUserId: row.waiterId || null,
    openedAt: row.openedAt,
    _local: true,
    _waiterPwa: true,
    items: items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      sentQuantity: i.status === 'SENT' ? i.quantity : (Number(i.sentQuantity) || 0),
      unitPrice: i.unitPrice,
      itemStatus:
        i.status === 'CANCELLED' || i.itemStatus === 'CANCELLED'
          ? 'CANCELLED'
          : i.status === 'SENT' || i.itemStatus === 'SENT_TO_KITCHEN'
            ? 'SENT_TO_KITCHEN'
            : 'NEW',
      portionText: i.portionText || null,
      note: i.note || null,
      modifiers: i.modifiers || [],
      stationId: i.stationId,
      categoryId: i.categoryId,
    })),
  };
}

function enqueueOutbox(deviceId, eventType, payload, clientEventId = null) {
  const id = newId();
  const cid = clientEventId || newId();
  return {
    id,
    deviceId,
    clientEventId: cid,
    eventType,
    status: 'PENDING',
    payload,
    createdAt: nowIso(),
    attemptCount: 0,
    nextRetryAt: null,
    error: null,
  };
}

export async function waiterOpenOrder(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const tableKey = input.tableId != null ? String(input.tableId) : null;
  if (tableKey) {
    const all = await idbGetAll('orders');
    const openOnTable = all.find((row) => (
      String(row.tableId || '') === tableKey
      && (row.status === 'OPEN' || row.status === 'ACTIVE' || row.status === 'BILLING')
    ));
    if (openOnTable) {
      return { orderId: openOnTable.id, order: toUiOrder(openOnTable), outboxId: null, reused: true };
    }
  }
  const orderId = input.orderId ? String(input.orderId) : newId();
  const existing = await idbGet('orders', orderId);
  if (existing) {
    return { orderId, order: toUiOrder(existing), outboxId: null };
  }
  const guestCount = Math.max(1, Number(input.guestCount) || 1);
  const at = nowIso();
  const order = {
    id: orderId,
    serverId: input.serverId || null,
    storeId: input.storeId,
    tableId: input.tableId != null ? String(input.tableId) : null,
    tableLabel: input.tableLabel || null,
    status: 'OPEN',
    guestCount,
    adultCount: input.adultCount ?? guestCount,
    childrenCount: input.childrenCount ?? 0,
    waiterId: input.waiterId || null,
    channel: input.channel || 'DINE_IN',
    comment: input.comment || null,
    openedAt: at,
    updatedAt: at,
    items: [],
  };
  const event = enqueueOutbox(deviceId, 'ORDER_OPEN', {
    orderId,
    storeId: input.storeId,
    tableId: order.tableId,
    guestCount,
    adultCount: order.adultCount,
    childrenCount: order.childrenCount,
    waiterId: order.waiterId,
    tableLabel: order.tableLabel,
    channel: order.channel,
    comment: order.comment,
  });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: order },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, order: toUiOrder(order), outboxId: event.id, clientEventId: event.clientEventId };
}

export async function waiterAddItem(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  if (!orderId) throw new Error('order_id_required');
  let order = await idbGet('orders', orderId);
  if (!order) {
    if (input.storeId == null) throw new Error(`order_not_found:${orderId}`);
    const at = nowIso();
    order = {
      id: orderId,
      serverId: input.serverId || orderId,
      storeId: input.storeId,
      tableId: input.tableId != null ? String(input.tableId) : null,
      tableLabel: input.tableLabel || null,
      status: 'OPEN',
      guestCount: Math.max(1, Number(input.guestCount) || 1),
      waiterId: input.waiterId || null,
      channel: input.channel || 'DINE_IN',
      openedAt: at,
      updatedAt: at,
      items: [],
      mirrored: true,
    };
  }
  const qty = Number(input.quantity ?? input.qty);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('item_qty_invalid');
  const name = String(input.name || '').trim();
  if (!name) throw new Error('item_name_required');

  const itemId = newId();
  const item = {
    id: itemId,
    menuItemId: input.menuItemId != null ? String(input.menuItemId) : null,
    name,
    quantity: qty,
    unitPrice: Number(input.unitPrice) || 0,
    note: input.note || null,
    modifiers: input.modifiers || [],
    status: 'OPEN',
    sentQuantity: 0,
    stationId: input.stationId,
    categoryId: input.categoryId,
  };
  const next = {
    ...order,
    status: order.status === 'OPEN' ? 'ACTIVE' : order.status,
    updatedAt: nowIso(),
    items: [...(order.items || []), item],
  };
  const event = enqueueOutbox(deviceId, 'ORDER_ADD_ITEM', {
    orderId,
    itemId,
    menuItemId: item.menuItemId,
    name,
    quantity: qty,
    unitPrice: item.unitPrice,
    note: item.note,
    modifiers: item.modifiers,
  });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, itemId, order: toUiOrder(next), outboxId: event.id };
}

export async function waiterUpdateItem(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  const itemId = String(input.itemId || '').trim();
  const order = await idbGet('orders', orderId);
  if (!order) throw new Error(`order_not_found:${orderId}`);
  const items = (order.items || []).map((i) => {
    if (String(i.id) !== itemId) return i;
    const next = { ...i };
    if (input.quantity != null) next.quantity = Number(input.quantity);
    if (input.note !== undefined) next.note = input.note || null;
    return next;
  });
  if (!(order.items || []).some((i) => String(i.id) === itemId)) {
    throw new Error(`item_not_found:${itemId}`);
  }
  const next = { ...order, items, updatedAt: nowIso() };
  const event = enqueueOutbox(deviceId, 'ORDER_UPDATE_ITEM', {
    orderId,
    itemId,
    quantity: input.quantity,
    note: input.note,
  });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, itemId, order: toUiOrder(next) };
}

export async function waiterCancelItem(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  const itemId = String(input.itemId || '').trim();
  const order = await idbGet('orders', orderId);
  if (!order) throw new Error(`order_not_found:${orderId}`);
  const items = (order.items || []).map((i) => (
    String(i.id) === itemId ? { ...i, status: 'CANCELLED', itemStatus: 'CANCELLED' } : i
  ));
  const next = { ...order, items, updatedAt: nowIso() };
  const event = enqueueOutbox(deviceId, 'ORDER_CANCEL_ITEM', { orderId, itemId });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, itemId, order: toUiOrder(next) };
}

export async function waiterCancelOrder(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  const order = await idbGet('orders', orderId);
  if (!order) throw new Error(`order_not_found:${orderId}`);
  const next = { ...order, status: 'CANCELLED', updatedAt: nowIso() };
  const event = enqueueOutbox(deviceId, 'ORDER_CANCEL', { orderId });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, order: toUiOrder(next) };
}

export async function waiterPayOrder(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  const order = await idbGet('orders', orderId);
  if (!order) throw new Error(`order_not_found:${orderId}`);
  const next = { ...order, status: 'PAID', updatedAt: nowIso() };
  const event = enqueueOutbox(deviceId, 'ORDER_PAY', {
    orderId,
    method: input.method || 'CASH',
    amount: input.amount,
    cashAmount: input.cashAmount,
    cardAmount: input.cardAmount,
  });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return { orderId, order: toUiOrder(next) };
}

/**
 * Mark pending lines SENT + outbox with printOnServer so station prints after sync.
 */
export async function waiterSendToKitchen(input = {}) {
  const deviceId = await getWaiterDeviceId();
  const orderId = String(input.orderId || '').trim();
  if (!orderId) throw new Error('order_required');
  let order = await idbGet('orders', orderId);
  const snapItems = Array.isArray(input.items) ? input.items : [];

  if (!order) {
    if (input.storeId == null) throw new Error(`order_not_found:${orderId}`);
    const at = nowIso();
    order = {
      id: orderId,
      storeId: input.storeId,
      tableId: input.tableId != null ? String(input.tableId) : null,
      tableLabel: input.tableLabel || null,
      status: 'ACTIVE',
      guestCount: 1,
      waiterId: input.waiterId || null,
      channel: 'DINE_IN',
      openedAt: at,
      updatedAt: at,
      items: [],
    };
  }

  const pendingSnap = [];
  const pendingIds = [];
  let items = (order.items || []).map((i) => {
    const qty = Number(i.quantity) || 0;
    const sent = Number(i.sentQuantity) || 0;
    const isOpen = i.status !== 'SENT' && i.status !== 'CANCELLED' && i.itemStatus !== 'CANCELLED';
    const left = qty - sent;
    if (isOpen && left > 0) {
      pendingIds.push(i.id);
      pendingSnap.push({
        name: i.name,
        qty: left,
        unitPrice: Number(i.unitPrice) || 0,
        menuItemId: i.menuItemId || null,
        note: i.note || null,
        modifiers: i.modifiers || [],
      });
      return {
        ...i,
        status: 'SENT',
        itemStatus: 'SENT_TO_KITCHEN',
        sentQuantity: qty,
      };
    }
    return i;
  });

  // UI-only pending (server order mirrored without local lines): append from snapshot as SENT.
  if (!pendingIds.length && snapItems.length) {
    for (const row of snapItems) {
      const id = newId();
      pendingIds.push(id);
      pendingSnap.push({
        name: row.name,
        qty: row.qty ?? row.quantity,
        unitPrice: row.unitPrice || 0,
        menuItemId: row.menuItemId || null,
        note: row.note || null,
        modifiers: row.modifiers || [],
      });
      items = [...items, {
        id,
        name: row.name,
        quantity: row.qty ?? row.quantity,
        unitPrice: row.unitPrice || 0,
        menuItemId: row.menuItemId || null,
        note: row.note || null,
        modifiers: row.modifiers || [],
        status: 'SENT',
        sentQuantity: row.qty ?? row.quantity,
      }];
    }
  }

  if (!pendingIds.length) throw new Error('no_pending_items');

  const next = {
    ...order,
    status: 'ACTIVE',
    updatedAt: nowIso(),
    items,
  };
  const event = enqueueOutbox(deviceId, 'ORDER_SEND_KITCHEN', {
    orderId,
    itemIds: pendingIds,
    items: pendingSnap,
    storeId: input.storeId ?? order.storeId,
    tableId: input.tableId ?? order.tableId,
    tableLabel: input.tableLabel || order.tableLabel || null,
    printOnServer: true,
  });
  await idbWriteAll([
    { type: 'put', store: 'orders', value: next },
    { type: 'put', store: 'outbox', value: event },
  ]);
  return {
    orderId,
    order: toUiOrder(next),
    outboxId: event.id,
    printOk: false,
    printError: 'waiter_pwa_server_print',
  };
}

export async function waiterGetOrder(orderId) {
  if (!orderId) return null;
  const row = await idbGet('orders', String(orderId));
  return toUiOrder(row);
}
