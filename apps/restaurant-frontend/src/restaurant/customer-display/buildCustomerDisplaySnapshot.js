import { CFD_PHASE, idleSnapshot } from './customerDisplayChannel';

function lineAmount(item) {
  const qty = Number(item?.quantity) || 0;
  const price = Number(item?.unitPrice ?? item?.price ?? 0);
  const explicit = Number(item?.lineTotal ?? item?.amount);
  if (Number.isFinite(explicit) && explicit !== 0) return explicit;
  return qty * price;
}

function activeItems(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.filter((item) => {
    const status = String(item?.itemStatus || item?.status || '').toUpperCase();
    if (status === 'CANCELLED') return false;
    return (Number(item?.quantity) || 0) > 0;
  });
}

/**
 * Map cashier order + pay UI state into a guest-display snapshot.
 */
export function buildCustomerDisplaySnapshot({
  order,
  storeName = '',
  payModalOpen = false,
  payPending = false,
  paidSale = null,
} = {}) {
  if (paidSale) {
    const saleTotal = Number(
      paidSale.totalAmount ?? paidSale.total ?? paidSale.amount ?? 0,
    );
    return {
      ...idleSnapshot(storeName),
      phase: CFD_PHASE.THANKS,
      orderNo: paidSale.orderNo ?? paidSale.receiptNo ?? null,
      total: saleTotal,
    };
  }

  const lines = activeItems(order).map((item) => ({
    id: item.id || `${item.name}-${item.quantity}`,
    name: String(item.name || item.menuItemName || '—'),
    qty: Number(item.quantity) || 0,
    amount: lineAmount(item),
    imageUrl: item.imageUrl || item.photoUrl || item.menuItemImageUrl || null,
  }));

  if (!order || lines.length === 0) {
    return idleSnapshot(storeName);
  }

  const subtotal = Number(order.subtotal) || lines.reduce((sum, row) => sum + row.amount, 0);
  const discountAmount = Math.max(0, Number(order.discountAmount) || 0);
  const serviceAmount = Math.max(0, Number(order.serviceAmount ?? order.serviceCharge) || 0);
  const total = Number(order.totalAmount ?? order.totalDue)
    || Math.max(0, subtotal + serviceAmount - discountAmount);

  const phase = (payModalOpen || payPending) ? CFD_PHASE.PAYING : CFD_PHASE.ACTIVE;

  return {
    ...idleSnapshot(storeName),
    phase,
    orderNo: order.orderNo ?? order.pickupNo ?? null,
    lines,
    subtotal,
    discountAmount,
    serviceAmount,
    total,
  };
}
