import { resolveOrderFlags } from './floorPosDerivations';

/** Soften POS flags for placeholder orders and foreign-table lock. */
export function resolveFloorOrderFlags({
  order,
  kitchenBoardEnabled,
  orderPartial,
  canMutateOrderLines,
}) {
  const rawFlags = resolveOrderFlags(order, kitchenBoardEnabled);
  if (orderPartial) {
    return {
      ...rawFlags,
      canCancel: false,
      canSendKitchen: false,
      canRequestBill: false,
      canPay: false,
    };
  }
  if (!canMutateOrderLines) {
    return {
      ...rawFlags,
      canCancel: false,
      canSendKitchen: false,
    };
  }
  return rawFlags;
}
