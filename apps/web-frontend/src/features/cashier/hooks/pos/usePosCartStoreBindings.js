import { useCartStore } from '../../../../store/cartStore';

export function usePosCartStoreBindings() {
  const items = useCartStore((s) => s.items);
  const addPieceItem = useCartStore((s) => s.addPieceItem);
  const addWeightLine = useCartStore((s) => s.addWeightLine);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateUnitPrice = useCartStore((s) => s.updateUnitPrice);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);
  const getLinesTotal = useCartStore((s) => s.getLinesTotal);
  const getOrderDiscount = useCartStore((s) => s.getOrderDiscount);
  const setOrderDiscountAmount = useCartStore((s) => s.setOrderDiscountAmount);
  const setOrderDiscountPercent = useCartStore((s) => s.setOrderDiscountPercent);
  const clearOrderDiscount = useCartStore((s) => s.clearOrderDiscount);
  const clearCart = useCartStore((s) => s.clearCart);
  const holdCart = useCartStore((s) => s.holdCart);
  const restoreParkedCart = useCartStore((s) => s.restoreParkedCart);
  const removeParkedCart = useCartStore((s) => s.removeParkedCart);
  const clearParkedCarts = useCartStore((s) => s.clearParkedCarts);
  const parkedCarts = useCartStore((s) => s.parkedCarts);
  const hasParkedCart = parkedCarts.length > 0;
  const checkNo = useCartStore((s) => s.checkNo);
  const customerId = useCartStore((s) => s.customerId);
  const customerName = useCartStore((s) => s.customerName);
  const setCustomer = useCartStore((s) => s.setCustomer);

  return {
    items,
    addPieceItem,
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    getTotal,
    getLinesTotal,
    getOrderDiscount,
    setOrderDiscountAmount,
    setOrderDiscountPercent,
    clearOrderDiscount,
    clearCart,
    holdCart,
    restoreParkedCart,
    removeParkedCart,
    clearParkedCarts,
    parkedCarts,
    hasParkedCart,
    checkNo,
    customerId,
    customerName,
    setCustomer,
  };
}
