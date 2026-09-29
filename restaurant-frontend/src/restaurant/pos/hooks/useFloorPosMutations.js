import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstMenuApi } from '../../api/menu.api';
import { rstOrderApi } from '../../api/order.api';
import { rstFloorApi } from '../../api/floor.api';
import { rstShiftApi } from '../../api/shift.api';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import { payRestaurantOrderWithFiscal } from '../utils/payRestaurantOrderWithFiscal';
import { restaurantPayTotal } from '../utils/buildRestaurantFiscalSale';
import { toPayAmountPayload } from '../utils/restaurantPayAmount';
import { emptyCounterForm } from '../utils/floorPosDerivations';
import { printCategoryTicketOnAdd, printKitchenTicket } from '../utils/printKitchenTicket';
import { printGuestBill } from '../utils/printGuestBill';
import {
  printOrdinarySaleReceipt,
  saleNeedsFiscalPrint,
} from '../utils/printOrdinarySaleReceipt';
import { toastApiError } from '../../../utils/apiError';

function addedPiece(prevItems, nextItems, menuItemId) {
  if (!menuItemId) return null;
  const next = (nextItems || []).filter(
    (item) => String(item.menuItemId) === String(menuItemId)
      && String(item.itemStatus || '').toUpperCase() !== 'CANCELLED',
  );
  const prevQty = new Map((prevItems || []).map((item) => [String(item.id), Number(item.quantity) || 0]));
  for (const line of next) {
    const before = prevQty.get(String(line.id));
    if (before == null) return { line, quantity: Number(line.quantity) || 1 };
    const delta = (Number(line.quantity) || 0) - before;
    if (delta > 0) return { line, quantity: delta };
  }
  return null;
}

export function useFloorPosMutations(deps) {
  const {
    t, storeId, storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, servicePreview,
    waiterNameById, user, printReceiptEnabled,
    setOpenTable, setActiveOrderId, setCounterModalOpen, setCounterForm,
    setShiftModal, setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote, setPaidReceipt,
    closePayModal,
  } = deps;

  const qc = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ['rst-menu-categories', storeId],
    queryFn: () => rstMenuApi.listCategories(storeId, true).then((r) => r.data ?? []),
    enabled: storeId != null,
    staleTime: 60_000,
  });
  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', storeId] });
  const invalidateCounter = () => qc.invalidateQueries({ queryKey: ['rst-counter-orders', storeId] });
  const invalidateShift = () => qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
  const invalidateRecentPaid = () => qc.invalidateQueries({ queryKey: ['rst-recent-paid', storeId] });
  const setOrderData = (res) => qc.setQueryData(['rst-order', activeOrderId], res.data);
  const errMsg = (err, key) => toastApiError(err, t(key));

  const openMutation = useMutation({
    mutationFn: () => {
      const guestCount = Math.max(1, Number(guestForm.guestCount) || 1);
      const childrenCount = Math.min(Math.max(0, Number(guestForm.childrenCount) || 0), guestCount);
      const payload = {
        guestCount,
        adultCount: guestCount - childrenCount,
        childrenCount,
      };
      if (guestForm.waiterUserId) {
        payload.waiterUserId = guestForm.waiterUserId;
      }
      if (guestForm.comment?.trim()) {
        payload.comment = guestForm.comment.trim();
      }
      return rstOrderApi.open(openTable.id, payload).then((r) => r.data);
    },
    onSuccess: (created) => {
      setOpenTable(null);
      setActiveOrderId(created.id);
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
    mutationFn: ({ menuItem, modifierOptionIds, note }) => rstOrderApi.addItem(activeOrderId, {
      menuItemId: menuItem.id,
      quantity: 1,
      modifierOptionIds: modifierOptionIds ?? [],
      note: note?.trim() || undefined,
    }),
    onSuccess: async (res, vars) => {
      setOrderData(res);
      setPendingMenuItem(null);
      setPendingVariants?.(null);
      setSelectedModifierIds([]);
      setPendingItemNote?.('');
      const piece = addedPiece(order?.items, res.data?.items, vars?.menuItem?.id);
      if (!piece) return;
      try {
        let categories = categoriesQuery.data;
        if (storeId != null && !categories?.length) {
          categories = await qc.fetchQuery({
            queryKey: ['rst-menu-categories', storeId],
            queryFn: () => rstMenuApi.listCategories(storeId, true).then((r) => r.data ?? []),
          });
        }
        const category = (categories || []).find(
          (item) => String(item.id) === String(vars?.menuItem?.menuCategoryId),
        );
        const printed = await printCategoryTicketOnAdd({
          order: res.data,
          line: piece.line,
          quantity: piece.quantity,
          category,
          t,
        });
        if (printed?.mode === 'missing') {
          toast.error(t('rst.admin.menuCategoryPrinterMissing', { name: printed.label }));
        }
      } catch (err) {
        toast.error(err?.message || t('receipt.printFailed'));
      }
    },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity, note }) => {
      const body = {};
      if (quantity != null) body.quantity = quantity;
      if (note !== undefined) body.note = note;
      return rstOrderApi.updateItem(activeOrderId, itemId, body);
    },
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
    mutationFn: async () => {
      const newItemIds = (order?.items ?? [])
        .filter((item) => String(item.itemStatus || '').toUpperCase() === 'NEW')
        .map((item) => item.id);
      const res = await rstOrderApi.sendToKitchen(activeOrderId);
      return { res, newItemIds };
    },
    onSuccess: async ({ res, newItemIds }) => {
      setOrderData(res);
      toast.success(t('rst.order.sentKitchen'));
      try {
        const printed = await printKitchenTicket({
          order: res.data,
          t,
          onlyItemIds: newItemIds,
        });
        if (printed?.configured && printed.missing?.length) {
          toast.error(t('rst.admin.kitchenPrinterMissing', {
            stations: printed.missing.join(', '),
          }));
        }
        if (printed?.errors?.length) {
          toast.error(printed.errors[0]);
        }
      } catch (err) {
        toast.error(err?.message || t('receipt.printFailed'));
      }
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
      toast.success(t('rst.order.cancelled'));
    },
    onError: (err) => errMsg(err, 'rst.order.cancelFailed'),
  });

  const billMutation = useMutation({
    mutationFn: () => rstOrderApi.requestBill(activeOrderId),
    onSuccess: async (res) => {
      setOrderData(res);
      invalidateFloor();
      invalidateCounter();
      toast.success(t('rst.order.billRequested'));
      try {
        const printed = await printGuestBill({ order: res.data, t });
        if (printed?.mode === 'silent') toast.success(t('rst.admin.billPrinted'));
        if (printed?.mode === 'missing') toast.error(t('rst.admin.billPrinterMissing'));
      } catch {
        toast.error(t('receipt.printFailed'));
      }
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
        storeId, storeName,
        shiftId: shift?.id ?? null,
        cashRegisterId: shift?.cashRegisterId ?? null,
        cashierName: user?.fullName || user?.username || undefined,
        waiterName, customerLabel, serviceLabel, t,
      });
    },
    onSuccess: async ({ sale }) => {
      setActiveOrderId(null);
      closePayModal?.();
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      invalidateRecentPaid();
      toast.success(t('rst.order.paid'));
      const shouldPrint = printReceiptEnabled;
      let printed = false;
      if (shouldPrint) {
        try {
          if (saleNeedsFiscalPrint(sale) && isCashierEscposPrintAvailable()) {
            await printFiscalReceipt({ sale, t, useModalShell: false });
          } else {
            await printOrdinarySaleReceipt({ sale, t });
          }
          toast.success(t('receipt.printSent'), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.successDurationMs,
          });
        } catch (err) {
          toast.error(
            (saleNeedsFiscalPrint(sale) && isCashierEscposPrintAvailable()
              ? resolveEscposPrintErrorMessage(err, t)
              : err?.message) ?? t('receipt.printFailed'),
            {
              id: CASHIER_ESCPOS_TOAST.toastId,
              duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
            },
          );
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
