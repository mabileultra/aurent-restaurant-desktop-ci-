import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { rstFloorApi } from '../../api/floor.api';
import { rstShiftApi } from '../../api/shift.api';
import { emptyCounterForm } from '../utils/floorPosDerivations';

/** Open table / extra check / counter + shift open/close + cleaning ready. */
export function useFloorOpenMutations({
  t, storeId, channel, guestForm, openTable, counterForm,
  openingCash, closingCash, shift,
  setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm, setShiftModal,
  cache,
}) {
  const {
    invalidateFloor, invalidateCounter, invalidateShift, setOrderData, errMsg,
  } = cache;

  const openMutation = useMutation({
    mutationFn: async (opts = {}) => {
      const table = opts.table ?? openTable;
      if (!table?.id) {
        return Promise.reject(new Error('table required'));
      }
      const guestCount = Math.max(1, Number(opts.guestCount ?? guestForm.guestCount) || 1);
      const childrenCount = Math.min(
        Math.max(0, Number(opts.childrenCount ?? guestForm.childrenCount) || 0),
        guestCount,
      );
      const payload = {
        guestCount,
        adultCount: guestCount - childrenCount,
        childrenCount,
      };
      const waiterUserId = opts.waiterUserId ?? guestForm.waiterUserId;
      if (waiterUserId) payload.waiterUserId = waiterUserId;
      const comment = opts.comment ?? guestForm.comment;
      if (comment?.trim()) payload.comment = comment.trim();
      return rstOrderApi.open(table.id, payload).then((r) => r.data);
    },
    onSuccess: (created) => {
      setOpenTable(null);
      setActiveOrderId(created.id);
      if (created?.id != null) setOrderData(created, created.id);
      invalidateFloor();
      invalidateShift();
    },
    onError: (err) => errMsg(err, 'rst.order.openFailed'),
  });

  const openExtraCheckMutation = useMutation({
    mutationFn: async ({ tableId, guestCount = 1, waiterUserId } = {}) => {
      const guests = Math.max(1, Number(guestCount) || 1);
      const payload = {
        guestCount: guests,
        adultCount: guests,
        childrenCount: 0,
      };
      if (waiterUserId) payload.waiterUserId = waiterUserId;
      return rstOrderApi.open(tableId, payload).then((r) => r.data);
    },
    onSuccess: (created) => {
      setOpenTable(null);
      setActiveOrderId(created.id);
      if (created?.id != null) setOrderData(created, created.id);
      invalidateFloor();
      invalidateShift();
      toast.success(t('rst.order.newCheckOpened', { defaultValue: 'Новый счёт открыт' }));
    },
    onError: (err) => errMsg(err, 'rst.order.openFailed'),
  });

  const openCounterMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientName: counterForm.clientName.trim() || undefined,
        clientPhone: counterForm.clientPhone.trim() || undefined,
        deliveryAddress: counterForm.deliveryAddress.trim() || undefined,
        comment: counterForm.comment.trim() || undefined,
      };
      const openFn = channel === 'DELIVERY' ? rstOrderApi.openDelivery : rstOrderApi.openTakeaway;
      return openFn(storeId, payload).then((r) => r.data);
    },
    onSuccess: (created) => {
      setCounterModalOpen(false);
      setCounterForm(emptyCounterForm());
      setActiveOrderId(created.id);
      invalidateCounter();
      invalidateShift();
    },
    onError: (err) => errMsg(err, 'rst.order.openFailed'),
  });

  const openShiftMutation = useMutation({
    mutationFn: async () => {
      const opening = Number(openingCash) || 0;
      return rstShiftApi.open(storeId, { openingCash: opening }).then((r) => r.data);
    },
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.opened'));
    },
    onError: (err) => errMsg(err, 'rst.shift.openFailed'),
  });

  const closeShiftMutation = useMutation({
    mutationFn: async () => {
      const closing = Number(closingCash) || 0;
      return rstShiftApi.close(shift.id, { closingCash: closing }).then((r) => r.data);
    },
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.closed'));
    },
    onError: (err) => errMsg(err, 'rst.shift.closeFailed'),
  });

  const markReadyMutation = useMutation({
    mutationFn: (tableId) => rstFloorApi.markReady(tableId).then((r) => r.data),
    onSuccess: () => {
      invalidateFloor();
      toast.success(t('rst.floor.cleaningDone'));
    },
    onError: (err) => errMsg(err, 'rst.floor.cleaningReadyFailed'),
  });

  return {
    openMutation,
    openExtraCheckMutation,
    openCounterMutation,
    openShiftMutation,
    closeShiftMutation,
    markReadyMutation,
  };
}
