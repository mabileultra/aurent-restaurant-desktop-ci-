import { newLineId } from './cartCalculations';

export const MAX_PARKED_CARTS = 6;

export const snapshotActiveCart = (state) => ({
  id: newLineId(),
  items: state.items.map((item) => ({ ...item })),
  orderDiscountAmount: state.orderDiscountAmount,
  customerId: state.customerId,
  customerName: state.customerName,
  checkNo: state.checkNo,
  prescriptionNumber: state.prescriptionNumber,
  parkedAt: Date.now(),
});

export const clearActiveCartFields = {
  items: [],
  orderDiscountAmount: 0,
  customerId: null,
  customerName: null,
  checkNo: null,
  prescriptionNumber: '',
};

export function executeHoldCart(state, set, get) {
  if (state.items.length > 0) {
    if (state.parkedCarts.length >= MAX_PARKED_CARTS) return 'full';
    set({
      parkedCarts: [...state.parkedCarts, snapshotActiveCart(state)],
      ...clearActiveCartFields,
    });
    return 'held';
  }
  if (state.parkedCarts.length === 1) {
    get().restoreParkedCart(state.parkedCarts[0].id);
    return 'restored';
  }
  if (state.parkedCarts.length > 1) return 'choose';
  return 'empty';
}

export function executeRestoreParkedCart(parkedId, state, set) {
  const ticket = state.parkedCarts.find((p) => p.id === parkedId);
  if (!ticket) return 'missing';

  let nextParked = state.parkedCarts.filter((p) => p.id !== parkedId);
  if (state.items.length > 0) {
    if (nextParked.length >= MAX_PARKED_CARTS) return 'full';
    nextParked = [...nextParked, snapshotActiveCart(state)];
  }

  set({
    items: ticket.items,
    orderDiscountAmount: ticket.orderDiscountAmount ?? 0,
    customerId: ticket.customerId ?? null,
    customerName: ticket.customerName ?? null,
    checkNo: ticket.checkNo ?? null,
    prescriptionNumber: ticket.prescriptionNumber ?? '',
    parkedCarts: nextParked,
  });
  return 'restored';
}
