import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { rstFloorApi } from '../../api/floor.api';
import { rstShiftApi } from '../../api/shift.api';
import { payRestaurantOrderWithFiscal } from '../utils/payRestaurantOrderWithFiscal';
import { restaurantPayTotal } from '../utils/buildRestaurantFiscalSale';
import { toPayAmountPayload } from '../utils/restaurantPayAmount';
import { emptyCounterForm } from '../utils/floorPosDerivations';
import {
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateQty,
} from '../utils/optimisticOrderPatch';
import { isWeightSoldMenuItem } from '../utils/menuWeightSale';
import {
  flushRestaurantPrintRelay,
} from '../utils/restaurantPrintFlush';
import { toastApiError } from '../../../utils/apiError';

export function useFloorPosMutations(deps) {
  const {
    t, storeId, storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, servicePreview,
    waiterNameById, user,
    setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm,
    setShiftModal, setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote,
    setPendingWeightItem, setPaidReceipt,
    closePayModal,
  } = deps;

  const qc = useQueryClient();
  /** Per dish(+mods+note): serialize double-taps; different dishes stay parallel. */
  const addItemQueuesRef = useRef(new Map());
  const enqueueAddItem = (key, run) => {
    const prev = addItemQueuesRef.current.get(key) || Promise.resolve();
    const queued = prev.then(run, run);
    addItemQueuesRef.current.set(key, queued.then(() => undefined, () => undefined));
    return queued;
  };
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

  const openMutation = useMutation({
    mutationFn: (opts = {}) => {
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
      if (waiterUserId) {
        payload.waiterUserId = waiterUserId;
      }
      const comment = opts.comment ?? guestForm.comment;
      if (comment?.trim()) {
        payload.comment = comment.trim();
      }
      return rstOrderApi.open(table.id, payload).then((r) => r.data);
    },
    onSuccess: (created) => {
      setOpenTable(null);
      setActiveOrderId(created.id);
      if (created?.id != null) qc.setQueryData(['rst-order', created.id], created);
      invalidateFloor();
      invalidateShift();
    },
    onError: (err) => errMsg(err, 'rst.order.openFailed'),
  });

  /** Extra check on an already occupied table — no guest form. */
  const openExtraCheckMutation = useMutation({
    mutationFn: ({ tableId, guestCount = 1, waiterUserId } = {}) => {
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
      if (created?.id != null) qc.setQueryData(['rst-order', created.id], created);
      invalidateFloor();
      invalidateShift();
      toast.success(t('rst.order.newCheckOpened', { defaultValue: 'Новый счёт открыт' }));
    },
    onError: (err) => errMsg(err, 'rst.order.openFailed'),
  });

  const openCounterMutation = useMutation({
    mutationFn: () => {
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
    mutationFn: () => rstShiftApi.open(storeId, { openingCash: Number(openingCash) || 0 }).then((r) => r.data),
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.opened'));
    },
    onError: (err) => errMsg(err, 'rst.shift.openFailed'),
  });

  const closeShiftMutation = useMutation({
    mutationFn: () => rstShiftApi.close(shift.id, { closingCash: Number(closingCash) || 0 }).then((r) => r.data),
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.closed'));
    },
    onError: (err) => errMsg(err, 'rst.shift.closeFailed'),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      const oid = orderIdOverride ?? activeOrderId;
      if (oid == null) {
        return Promise.reject(new Error('order required'));
      }
      const mods = (modifierOptionIds ?? []).map(String).sort().join(',');
      const noteKey = note?.trim() || '';
      const qty = Number(quantity) > 0 ? Number(quantity) : 1;
      // Weight adds share one queue key (ignore grams note) so 200г+300г merge server-side.
      const key = isWeightSoldMenuItem(menuItem) && !mods
        ? `${oid}:${menuItem.id}:weight`
        : `${oid}:${menuItem.id}:${mods}:${noteKey}:${qty}`;
      return enqueueAddItem(key, () => rstOrderApi.addItem(oid, {
        menuItemId: menuItem.id,
        quantity: qty,
        modifierOptionIds: modifierOptionIds ?? [],
        note: noteKey || undefined,
      }));
    },
    onMutate: async ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      const oid = orderIdOverride ?? activeOrderId;
      const key = orderKeyFor(oid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      patchOrder(
        (order) => optimisticAddItem(order, menuItem, { modifierOptionIds, note, quantity }),
        oid,
      );
      return { wasBilling: prev?.status === 'BILLING', orderId: oid };
    },
    onSuccess: (res, _vars, ctx) => {
      setOrderData(res, ctx?.orderId);
      setPendingMenuItem(null);
      setPendingVariants?.(null);
      setSelectedModifierIds([]);
      setPendingItemNote?.('');
      setPendingWeightItem?.(null);
      if (ctx?.wasBilling) {
        invalidateFloor();
      }
      flushRestaurantPrintRelay();
    },
    onError: (err, vars) => {
      qc.invalidateQueries({ queryKey: orderKeyFor(vars?.orderId) });
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity, note }) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      const body = {};
      if (quantity != null) body.quantity = quantity;
      if (note !== undefined) body.note = note;
      return rstOrderApi.updateItem(activeOrderId, itemId, body);
    },
    onMutate: async ({ itemId, quantity }) => {
      if (quantity == null) return undefined;
      await qc.cancelQueries({ queryKey: orderKeyFor(activeOrderId) });
      patchOrder((order) => optimisticUpdateQty(order, itemId, quantity));
    },
    onSuccess: (res) => {
      if (res?.data) setOrderData(res);
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
    },
    onError: (err) => {
      qc.invalidateQueries({ queryKey: orderKeyFor(activeOrderId) });
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      return rstOrderApi.removeItem(activeOrderId, itemId);
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: orderKeyFor(activeOrderId) });
      patchOrder((order) => optimisticRemoveItem(order, itemId));
    },
    onSuccess: (res) => {
      if (res?.data) setOrderData(res);
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
    },
    onError: (err) => {
      qc.invalidateQueries({ queryKey: orderKeyFor(activeOrderId) });
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const assignWaiterMutation = useMutation({
    mutationFn: (waiterUserId) => rstOrderApi.assignWaiter(activeOrderId, { waiterUserId }),
    onSuccess: (res) => {
      setOrderData(res);
      invalidateFloor();
      toast.success(t('rst.order.waiterAssigned'));
    },
    onError: (err) => errMsg(err, 'rst.order.waiterAssignFailed'),
  });

  const updateGuestsMutation = useMutation({
    mutationFn: (payload) => {
      const guestCount = Math.max(1, Number(payload.guestCount) || 1);
      const childrenCount = Math.min(
        guestCount,
        Math.max(0, Number(payload.childrenCount ?? 0)),
      );
      return rstOrderApi.updateGuests(activeOrderId, {
        guestCount,
        adultCount: guestCount - childrenCount,
        childrenCount,
      });
    },
    onSuccess: (res) => { setOrderData(res); invalidateFloor(); },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const sendKitchenMutation = useMutation({
    mutationFn: () => rstOrderApi.sendToKitchen(activeOrderId),
    onSuccess: (res) => {
      setOrderData(res);
      toast.success(t('rst.order.sentKitchen'));
      flushRestaurantPrintRelay();
    },
    onError: (err) => errMsg(err, 'rst.order.sendFailed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => rstOrderApi.cancel(activeOrderId),
    onSuccess: () => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled', storeId] });
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
      toast.success(t('rst.order.cancelled'));
    },
    onError: (err) => errMsg(err, 'rst.order.cancelFailed'),
  });

  const billMutation = useMutation({
    mutationFn: () => rstOrderApi.requestBill(activeOrderId),
    onSuccess: (res) => {
      setOrderData(res);
      invalidateFloor();
      invalidateCounter();
      toast.success(t('rst.order.billRequested'));
      // One print path only: server GUEST_BILL → desktop relay (avoid local+relay double slip).
      flushRestaurantPrintRelay();
    },
    onError: (err) => errMsg(err, 'rst.order.billFailed'),
  });

  const discountMutation = useMutation({
    mutationFn: (discountAmount) => rstOrderApi.updateDiscount(activeOrderId, { discountAmount }),
    onSuccess: (res) => {
      setOrderData(res);
      toast.success(t('rst.order.discountSaved', { defaultValue: 'Скидка сохранена' }));
    },
    onError: (err) => errMsg(err, 'rst.order.discountFailed'),
  });

  const payMutation = useMutation({
    mutationFn: async (payload = {}) => {
      if (!order?.id) throw new Error('ORDER_MISSING');
      const channel = order.channel || 'DINE_IN';
      const orderForPay = {
        ...order,
        channel,
        servicePercent: order.servicePercent != null
          ? order.servicePercent : (servicePreview?.percent ?? 0),
        serviceAmount: order.serviceAmount != null
          ? order.serviceAmount
          : (channel === 'DINE_IN' ? (servicePreview?.amount ?? 0) : 0),
      };
      const due = toPayAmountPayload(
        payload.amount ?? restaurantPayTotal(orderForPay, servicePreview),
      );
      const method = payload.method || 'CASH';
      const waiterName = orderForPay.waiterUserId
        ? waiterNameById.get(String(orderForPay.waiterUserId)) : null;
      const customerLabel = channel === 'DINE_IN'
        ? (orderForPay.tableCode ? t('rst.order.receiptTable', { code: orderForPay.tableCode }) : null)
        : (orderForPay.clientName || null);
      const serviceLabel = channel === 'DINE_IN' && Number(orderForPay.serviceAmount) > 0
        ? t('rst.order.serviceLine', { percent: Number(orderForPay.servicePercent ?? 0) })
        : null;
      return payRestaurantOrderWithFiscal({
        order: orderForPay,
        method,
        amount: due,
        cashAmount: payload.cashAmount,
        cardAmount: payload.cardAmount,
        amountTendered: payload.amountTendered,
        changeGiven: payload.changeGiven,
        cardType: payload.cardType || null,
        debtPhone: payload.debtPhone,
        debtComment: payload.debtComment,
        advancePaid: payload.advancePaid,
        storeId, storeName,
        shiftId: shift?.id ?? null,
        cashRegisterId: shift?.cashRegisterId ?? null,
        cashierName: user?.fullName || user?.username || undefined,
        waiterName, customerLabel, serviceLabel, t,
      });
    },
    onSuccess: async () => {
      setActiveOrderId(null);
      closePayModal?.();
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      invalidateRecentPaid();
      toast.success(t('rst.order.paid'));
    },
    onError: (err) => {
      if (err?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || err?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
        toast.error(t('cashRegisters.multikassa.fiscalOfflineBlocked'));
        return;
      }
      if (err?.code === 'MULTIKASSA_FISCAL_FAILED') {
        toast.error(err.message || t('cashRegisters.multikassa.fiscalFailed'));
        return;
      }
      toastApiError(err, t('rst.order.payFailed'));
    },
  });

  const refundMutation = useMutation({
    mutationFn: (orderId) => rstOrderApi.refund(orderId),
    onSuccess: () => {
      setPaidReceipt(null);
      invalidateShift();
      invalidateRecentPaid();
      toast.success(t('rst.order.refunded'));
    },
    onError: (err) => errMsg(err, 'rst.order.refundFailed'),
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
    openMutation, openExtraCheckMutation, openCounterMutation, openShiftMutation, closeShiftMutation,
    addItemMutation, updateItemMutation, removeItemMutation, assignWaiterMutation,
    updateGuestsMutation, sendKitchenMutation, cancelMutation, billMutation,
    discountMutation, payMutation, refundMutation, markReadyMutation,
  };
}
