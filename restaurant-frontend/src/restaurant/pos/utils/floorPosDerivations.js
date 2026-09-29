/** Staff / waiter / order flag helpers for floor POS. */

export function userStoreIds(user) {
  if (Array.isArray(user.storeIds)) return user.storeIds.map(Number);
  if (Array.isArray(user.stores)) {
    return user.stores.map((s) => Number(s && typeof s === 'object' ? s.id : s));
  }
  return [];
}

export function displayUserName(user) {
  return user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || String(user.id);
}

export function buildWaiters(staffRows, storeId) {
  if (storeId == null) return [];
  return (staffRows ?? [])
    .filter((row) => row.role === 'WAITER' && row.active !== false)
    .filter((row) => userStoreIds(row).includes(Number(storeId)))
    .map((row) => ({ id: row.id, name: displayUserName(row) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Delivery couriers: store staff who can run deliveries (no new role required). */
const COURIER_ROLES = new Set(['WAITER', 'CASHIER', 'ADMIN', 'MANAGER']);

export function buildCouriers(staffRows, storeId) {
  if (storeId == null) return [];
  return (staffRows ?? [])
    .filter((row) => COURIER_ROLES.has(row.role) && row.active !== false)
    .filter((row) => userStoreIds(row).includes(Number(storeId)))
    .map((row) => ({ id: row.id, fullName: displayUserName(row) }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function buildWaiterNameById(staffRows) {
  const map = new Map();
  for (const row of staffRows ?? []) {
    map.set(String(row.id), displayUserName(row));
  }
  return map;
}

export function resolveOrderHallName(halls, order, selectedHallName) {
  if (!order?.tableId) return selectedHallName ?? null;
  for (const hall of halls) {
    if ((hall.tables ?? []).some((table) => table.id === order.tableId)) {
      return hall.name;
    }
  }
  return selectedHallName ?? null;
}

export function computeCommissionPreview(order, settings) {
  if (!order || order.channel !== 'DINE_IN') return null;
  if (order.commissionPercent != null) {
    return {
      percent: Number(order.commissionPercent),
      amount: Number(order.commissionAmount ?? 0),
    };
  }
  if (!settings) return null;
  const waiterId = order.waiterUserId ? String(order.waiterUserId) : null;
  const override = (settings.overrides ?? []).find((row) => String(row.userId) === waiterId);
  const percent = Number(override?.percent ?? settings.defaultPercent ?? 0);
  const subtotal = Number(order.subtotal ?? 0);
  const amount = Math.round(((subtotal * percent) / 100) * 100) / 100;
  return { percent, amount };
}

export function emptyGuestForm() {
  return {
    guestCount: 2,
    adultCount: 2,
    childrenCount: 0,
    waiterUserId: '',
    comment: '',
  };
}

export function emptyCounterForm() {
  return {
    clientName: '',
    clientPhone: '',
    deliveryAddress: '',
    comment: '',
  };
}

export function resolveBackLabelKey(posMode) {
  if (posMode === 'takeaway') return 'rst.pos.backToTakeaway';
  if (posMode === 'delivery') return 'rst.pos.backToDelivery';
  return 'rst.order.backToFloor';
}

export function resolveOrderFlags(order, kitchenBoardEnabled = true) {
  const items = order?.items ?? [];
  const hasBillable = items.some((item) => item.itemStatus !== 'CANCELLED');
  const hasNew = items.some((item) => item.itemStatus === 'NEW');
  const boardOn = kitchenBoardEnabled !== false;
  return {
    canCancel: items.length === 0,
    // Always allow send while there are NEW lines (incl. after bill). Board only gates KDS + bill-before-send.
    canSendKitchen: (order?.status === 'OPEN' || order?.status === 'BILLING') && hasNew,
    // Board off: bill without sending NEW first. Board on: must send before bill.
    canRequestBill: order?.status === 'OPEN' && hasBillable && (boardOn ? !hasNew : true),
    canPay: order?.status === 'BILLING',
  };
}
