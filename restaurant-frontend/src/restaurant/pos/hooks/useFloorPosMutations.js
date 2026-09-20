import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { rstShiftApi } from '../../api/shift.api';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import { payRestaurantOrderWithFiscal } from '../utils/payRestaurantOrderWithFiscal';
import { restaurantPayTotal } from '../utils/buildRestaurantFiscalSale';
import { emptyCounterForm } from '../utils/floorPosDerivations';

export function useFloorPosMutations(deps) {
  const {
    t, storeId, storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, commissionPreview,
    waiterNameById, user, printReceiptEnabled,
    setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm,
    setShiftModal, setPendingMenuItem, setSelectedModifierIds, setPaidReceipt,
  } = deps;

  const qc = useQueryClient();
  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', storeId] });
  const invalidateCounter = () => qc.invalidateQueries({ queryKey: ['rst-counter-orders', storeId] });
  const invalidateShift = () => qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
  const setOrderData = (res) => qc.setQueryData(['rst-order', activeOrderId], res.data);
  const errMsg = (err, key) => toast.error(err?.response?.data?.message ?? t(key));

  const openMutation = useMutation({
    mutationFn: () => {
      const guestCount = Math.max(1, Number(guestForm.guestCount) || 1);
      const childrenCount = Math.min(Math.max(0, Number(guestForm.childrenCount) || 0), guestCount);
      return rstOrderApi.open(openTable.id, {
        guestCount, adultCount: guestCount - childrenCount, childrenCount,
      }).then((r) => r.data);
    },
    onSuccess: (created) => {
      setOpenTable(null);
      setActiveOrderId(created.id);
      invalidateFloor();
      invalidateShift();
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
    mutationFn: ({ menuItem, modifierOptionIds }) => rstOrderApi.addItem(activeOrderId, {
      menuItemId: menuItem.id, quantity: 1, modifierOptionIds: modifierOptionIds ?? [],
    }),
    onSuccess: (res) => {
      setOrderData(res);
      setPendingMenuItem(null);
      setSelectedModifierIds([]);
    },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => rstOrderApi.updateItem(activeOrderId, itemId, { quantity }),
    onSuccess: setOrderData,
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => rstOrderApi.removeItem(activeOrderId, itemId),
    onSuccess: setOrderData,
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
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
    mutationFn: (guestCount) => rstOrderApi.updateGuests(activeOrderId, {
      guestCount, adultCount: guestCount, childrenCount: 0,
    }),
    onSuccess: (res) => { setOrderData(res); invalidateFloor(); },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const sendKitchenMutation = useMutation({
    mutationFn: () => rstOrderApi.sendToKitchen(activeOrderId),
    onSuccess: (res) => { setOrderData(res); toast.success(t('rst.order.sentKitchen')); },
    onError: (err) => errMsg(err, 'rst.order.sendFailed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => rstOrderApi.cancel(activeOrderId),
    onSuccess: () => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
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
    },
    onError: (err) => errMsg(err, 'rst.order.billFailed'),
  });

  const payMutation = useMutation({
    mutationFn: async ({ method, amount }) => {
      if (!order?.id) throw new Error('ORDER_MISSING');
      const orderForPay = {
        ...order,
        commissionPercent: order.commissionPercent != null
          ? order.commissionPercent : (commissionPreview?.percent ?? 0),
        commissionAmount: order.commissionAmount != null
          ? order.commissionAmount
          : (order.channel === 'DINE_IN' ? (commissionPreview?.amount ?? 0) : 0),
      };
      const waiterName = orderForPay.waiterUserId
        ? waiterNameById.get(String(orderForPay.waiterUserId)) : null;
      const customerLabel = orderForPay.channel === 'DINE_IN'
        ? (orderForPay.tableCode ? t('rst.order.receiptTable', { code: orderForPay.tableCode }) : null)
        : (orderForPay.clientName || null);
      const serviceLabel = orderForPay.channel === 'DINE_IN' && Number(orderForPay.commissionAmount) > 0
        ? t('rst.order.serviceLine', { percent: Number(orderForPay.commissionPercent ?? 0) })
        : null;
      return payRestaurantOrderWithFiscal({
        order: orderForPay, method,
        amount: amount ?? restaurantPayTotal(orderForPay),
        storeId, storeName,
        shiftId: shift?.id ?? null,
        cashRegisterId: shift?.cashRegisterId ?? null,
        cashierName: user?.fullName || user?.username || undefined,
        waiterName, customerLabel, serviceLabel, t,
      });
    },
    onSuccess: async ({ sale }) => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      toast.success(t('rst.order.paid'));
      const shouldPrint = printReceiptEnabled;
      setPaidReceipt({ sale, autoPrint: shouldPrint && !isCashierEscposPrintAvailable() });
      if (shouldPrint && isCashierEscposPrintAvailable()) {
        try {
          await printFiscalReceipt({ sale, t });
          toast.success(t('receipt.printSent'), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.successDurationMs,
          });
        } catch (err) {
          toast.error(resolveEscposPrintErrorMessage(err, t), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
          });
        }
      }
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
      toast.error(err?.response?.data?.message ?? err?.message ?? t('rst.order.payFailed'));
    },
  });

  const refundMutation = useMutation({
    mutationFn: (orderId) => rstOrderApi.refund(orderId),
    onSuccess: () => {
      setPaidReceipt(null);
      invalidateShift();
      toast.success(t('rst.order.refunded'));
    },
    onError: (err) => errMsg(err, 'rst.order.refundFailed'),
  });

  return {
    openMutation, openCounterMutation, openShiftMutation, closeShiftMutation,
    addItemMutation, updateItemMutation, removeItemMutation, assignWaiterMutation,
    updateGuestsMutation, sendKitchenMutation, cancelMutation, billMutation,
    payMutation, refundMutation,
  };
}
