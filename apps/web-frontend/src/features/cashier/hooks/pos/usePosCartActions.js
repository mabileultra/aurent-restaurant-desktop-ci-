import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function usePosCartActions({
  items,
  holdCart,
  restoreParkedCart,
  removeParkedCart,
  clearParkedCarts,
  parkedCarts,
  clearCart,
  setSelectedLineId,
  setDiscountOpen,
  setCustomer,
  discountOpen,
  payOpen,
  returnOpen,
  t,
}) {
  const handleDiscount = useCallback(() => {
    if (items.length === 0) {
      toast.error(t('pos.cartEmpty'));
      return;
    }
    setDiscountOpen(true);
  }, [items.length, setDiscountOpen, t]);

  const handleHoldCart = useCallback(() => {
    if (returnOpen || discountOpen || payOpen) return;
    const result = holdCart();
    setSelectedLineId(null);
    if (result === 'held') {
      toast.success(t('pos.holdReceiptDone'));
      return;
    }
    if (result === 'restored') {
      toast.success(t('pos.restoreReceiptDone'));
      return;
    }
    if (result === 'full') {
      toast.error(t('pos.holdReceiptFull'));
      return;
    }
    if (result === 'choose') {
      toast(t('pos.holdReceiptChoose'));
      return;
    }
    toast.error(t('pos.holdReceiptEmpty'));
  }, [discountOpen, holdCart, payOpen, returnOpen, setSelectedLineId, t]);

  const handleRestoreParked = useCallback(
    (parkedId) => {
      const result = restoreParkedCart(parkedId);
      setSelectedLineId(null);
      if (result === 'restored') {
        toast.success(t('pos.restoreReceiptDone'));
        return;
      }
      if (result === 'full') {
        toast.error(t('pos.holdReceiptFull'));
        return;
      }
      toast.error(t('pos.holdReceiptEmpty'));
    },
    [restoreParkedCart, setSelectedLineId, t]
  );

  const handleRemoveParked = useCallback(
    (parkedId) => {
      removeParkedCart(parkedId);
      toast.success(t('pos.parkedCartRemoved'));
    },
    [removeParkedCart, t]
  );

  const handleClearParked = useCallback(() => {
    if (!parkedCarts.length) return;
    if (!window.confirm(t('pos.parkedCartsClearConfirm'))) return;
    clearParkedCarts();
    toast.success(t('pos.parkedCartsCleared'));
  }, [clearParkedCarts, parkedCarts.length, t]);

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    if (!window.confirm(t('pos.clearOrderConfirm'))) return;
    clearCart();
    setSelectedLineId(null);
    toast.success(t('pos.clearOrderDone'));
  }, [clearCart, items.length, setSelectedLineId, t]);

  const handleSetCustomer = useCallback(
    (id, name) => {
      setCustomer(id, name);
      if (id) toast.success(t('pos.customerCardApplied', { name: name || '' }));
      else toast.success(t('pos.customerCardCleared'));
    },
    [setCustomer, t]
  );

  return {
    handleDiscount,
    handleHoldCart,
    handleRestoreParked,
    handleRemoveParked,
    handleClearParked,
    handleClearCart,
    handleSetCustomer,
  };
}
