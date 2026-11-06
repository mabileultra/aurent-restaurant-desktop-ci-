import { toastApiError } from '../../../utils/apiError';

/** Shared React Query helpers for floor POS mutations. */
export function createFloorPosMutationCache(qc, { storeId, activeOrderId, t }) {
  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', storeId] });
  const invalidateCounter = () => qc.invalidateQueries({ queryKey: ['rst-counter-orders', storeId] });
  const invalidateShift = () => qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
  const invalidateRecentPaid = () => qc.invalidateQueries({ queryKey: ['rst-recent-paid', storeId] });

  const setOrderData = (res, orderId = activeOrderId) => {
    if (orderId == null) return;
    const data = res?.data !== undefined ? res.data : res;
    qc.setQueryData(['rst-order', orderId], data);
  };

  const orderKeyFor = (orderId) => ['rst-order', orderId ?? activeOrderId];

  const patchOrder = (updater, orderId = activeOrderId) => {
    if (orderId == null) return undefined;
    const key = orderKeyFor(orderId);
    const prev = qc.getQueryData(key);
    if (!prev) return undefined;
    qc.setQueryData(key, updater(prev));
    return prev;
  };

  const errMsg = (err, key) => toastApiError(err, t(key));

  return {
    invalidateFloor,
    invalidateCounter,
    invalidateShift,
    invalidateRecentPaid,
    setOrderData,
    orderKeyFor,
    patchOrder,
    errMsg,
  };
}
