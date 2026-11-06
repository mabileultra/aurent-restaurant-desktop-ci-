import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { requireOrderId } from '../utils/requireOrderId';
import { flushRestaurantPrintRelay } from '../utils/restaurantPrintFlush';

/** Waiter / guests / kitchen / bill / cancel / discount — order lifecycle (not pay). */
export function useFloorOrderFlowMutations({
  t, qc, storeId, activeOrderId, order, setActiveOrderId, cache,
}) {
  const {
    invalidateFloor, invalidateCounter, invalidateShift, setOrderData, errMsg,
  } = cache;

  const assignWaiterMutation = useMutation({
    mutationFn: async (waiterUserId) => {
      return rstOrderApi.assignWaiter(activeOrderId, { waiterUserId }).then((r) => r?.data ?? r);
    },
    onSuccess: (res) => {
      setOrderData(res);
      invalidateFloor();
      toast.success(t('rst.order.waiterAssigned'));
    },
    onError: (err) => errMsg(err, 'rst.order.waiterAssignFailed'),
  });

  const updateGuestsMutation = useMutation({
    mutationFn: async (payload) => {
      const guestCount = Math.max(1, Number(payload.guestCount) || 1);
      const childrenCount = Math.min(
        guestCount,
        Math.max(0, Number(payload.childrenCount ?? 0)),
      );
      const body = {
        guestCount,
        adultCount: guestCount - childrenCount,
        childrenCount,
      };
      return rstOrderApi.updateGuests(activeOrderId, body).then((r) => r?.data ?? r);
    },
    onSuccess: (res) => { setOrderData(res); invalidateFloor(); },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const sendKitchenMutation = useMutation({
    mutationFn: async () => {
      const orderId = requireOrderId(activeOrderId, order?.id);
      const res = await rstOrderApi.sendToKitchen(orderId);
      return res?.data !== undefined ? res.data : res;
    },
    onSuccess: (res) => {
      setOrderData(res);
      toast.success(t('rst.order.sentKitchen'));
      if (res?._printFailed && !res?._needsRelay) {
        toast.error(t('rst.order.savedNotPrinted', {
          defaultValue: 'Заказ сохранён, но не напечатан: принтер кухни не настроен',
        }));
      }
      flushRestaurantPrintRelay();
      invalidateFloor();
    },
    onError: (err) => {
      const msg = String(err?.message || '');
      if (msg === 'no_pending_items') {
        toast.error(t('rst.order.nothingToSend', { defaultValue: 'Нет новых позиций для кухни' }));
        return;
      }
      if (msg === 'order_required' || msg === 'order required') {
        toast.error(t('rst.order.orderRequired', {
          defaultValue: 'Сначала откройте стол и добавьте блюдо',
        }));
        return;
      }
      errMsg(err, 'rst.order.sendFailed');
    },
  });

  const reprintPickupMutation = useMutation({
    mutationFn: async () => {
      const orderId = requireOrderId(activeOrderId, order?.id);
      const res = await rstOrderApi.reprintPickupLabel(orderId);
      return res?.data !== undefined ? res.data : res;
    },
    onSuccess: (res) => {
      setOrderData(res);
      toast.success(t('rst.order.pickupPrinted'));
      flushRestaurantPrintRelay();
      invalidateFloor();
    },
    onError: (err) => errMsg(err, 'rst.order.pickupFailed'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => rstOrderApi.cancel(activeOrderId),
    onSuccess: () => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled', storeId] });
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
      toast.success(t('rst.order.cancelled'));
      flushRestaurantPrintRelay();
    },
    onError: (err) => errMsg(err, 'rst.order.cancelFailed'),
  });

  const billMutation = useMutation({
    mutationFn: async () => {
      return rstOrderApi.requestBill(activeOrderId).then((r) => (r?.data !== undefined ? r.data : r));
    },
    onSuccess: (res) => {
      setOrderData(res);
      invalidateFloor();
      invalidateCounter();
      toast.success(t('rst.order.billRequested'));
      flushRestaurantPrintRelay();
    },
    onError: (err) => errMsg(err, 'rst.order.billFailed'),
  });

  const discountMutation = useMutation({
    mutationFn: async (discountAmount) => {
      return rstOrderApi.updateDiscount(activeOrderId, { discountAmount }).then((r) => r?.data ?? r);
    },
    onSuccess: (res) => {
      setOrderData(res);
      toast.success(t('rst.order.discountSaved', { defaultValue: 'Скидка сохранена' }));
    },
    onError: (err) => errMsg(err, 'rst.order.discountFailed'),
  });

  return {
    assignWaiterMutation,
    updateGuestsMutation,
    sendKitchenMutation,
    reprintPickupMutation,
    cancelMutation,
    billMutation,
    discountMutation,
  };
}
