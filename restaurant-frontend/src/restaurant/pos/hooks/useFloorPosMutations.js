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
import { requireOrderId, isUsableOrderId } from '../utils/requireOrderId';
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
import { sendKitchenLocalFirst } from '../utils/sendKitchenLocalFirst';
import {
  isRestaurantLocalFirstOn,
  rstOfflineOpenOrder,
  rstOfflineAddItem,
  rstOfflineUpdateItem,
  rstOfflineCancelItem,
  rstOfflineCancelOrder,
  rstOfflineRequestBill,
  rstOfflinePatchOrderMeta,
  rstOfflineListCategories,
  rstOfflineOpenShift,
  rstOfflineCloseShift,
} from '../../../services/offline/restaurantOfflineBridge';
import { tickWaiterOutbox } from '../../../services/offline/waiterPwa/outboxSync';
import { getDesktopPrinterSettings } from '../utils/desktopPrinters';
import { rstMenuApi } from '../../api/menu.api';
import { logLocalFirst } from '../../../services/desktop/activityLog';

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
      if (waiterUserId) {
        payload.waiterUserId = waiterUserId;
      }
      const comment = opts.comment ?? guestForm.comment;
      if (comment?.trim()) {
        payload.comment = comment.trim();
      }

      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        // Local TX + outbox first — never block UI on WAN (15s axios hang).
        const local = await rstOfflineOpenOrder({
          storeId,
          tableId: table.id,
          tableLabel: table.code || table.name,
          guestCount,
          adultCount: payload.adultCount,
          childrenCount: payload.childrenCount,
          waiterId: waiterUserId || null,
          comment: payload.comment || null,
        });
        logLocalFirst('Открытие стола (local-first)', {
          orderId: local.orderId || local.order?.id,
          tableId: table.id,
        });
        return local.order;
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
    mutationFn: async ({ tableId, guestCount = 1, waiterUserId } = {}) => {
      const guests = Math.max(1, Number(guestCount) || 1);
      const payload = {
        guestCount: guests,
        adultCount: guests,
        childrenCount: 0,
      };
      if (waiterUserId) payload.waiterUserId = waiterUserId;
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineOpenOrder({
          storeId,
          tableId,
          tableLabel: null,
          guestCount: guests,
          adultCount: guests,
          childrenCount: 0,
          waiterId: waiterUserId || null,
          forceNew: true,
        });
        logLocalFirst('Доп. счёт (local-first)', { orderId: local.orderId, tableId });
        return local.order;
      }
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
    mutationFn: async () => {
      const payload = {
        clientName: counterForm.clientName.trim() || undefined,
        clientPhone: counterForm.clientPhone.trim() || undefined,
        deliveryAddress: counterForm.deliveryAddress.trim() || undefined,
        comment: counterForm.comment.trim() || undefined,
      };
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineOpenOrder({
          storeId,
          allowNoTable: true,
          tableId: null,
          guestCount: 1,
          channel: channel || 'TAKEAWAY',
          comment: payload.comment || null,
          clientName: payload.clientName || null,
          clientPhone: payload.clientPhone || null,
          deliveryAddress: payload.deliveryAddress || null,
        });
        logLocalFirst('Счётчик (local-first)', { orderId: local.orderId, channel });
        return local.order;
      }
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
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineOpenShift({ storeId, openingCash: opening });
        logLocalFirst('Смена открыта (local-first)', { shiftId: local.shift?.id });
        void rstShiftApi.open(storeId, { openingCash: opening }).then((r) => {
          if (r?.data) {
            void import('../../../services/offline/restaurantOfflineBridge')
              .then((m) => m.rstOfflineSaveShift({ storeId, shift: r.data }))
              .catch(() => null);
          }
        }).catch(() => null);
        return local.shift;
      }
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
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineCloseShift({ storeId, closingCash: closing });
        logLocalFirst('Смена закрыта (local-first)', { shiftId: local.shift?.id });
        if (shift?.id) {
          void rstShiftApi.close(shift.id, { closingCash: closing }).catch(() => null);
        }
        return local.shift;
      }
      return rstShiftApi.close(shift.id, { closingCash: closing }).then((r) => r.data);
    },
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.closed'));
    },
    onError: (err) => errMsg(err, 'rst.shift.closeFailed'),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      let oid;
      try {
        oid = requireOrderId(orderIdOverride, activeOrderId, order?.id);
      } catch {
        return Promise.reject(new Error('order_required'));
      }
      const mods = (modifierOptionIds ?? []).map(String).sort().join(',');
      const noteKey = note?.trim() || '';
      const qty = Number(quantity) > 0 ? Number(quantity) : 1;
      // Weight adds share one queue key (ignore grams note) so 200г+300г merge server-side.
      const key = isWeightSoldMenuItem(menuItem) && !mods
        ? `${oid}:${menuItem.id}:weight`
        : `${oid}:${menuItem.id}:${mods}:${noteKey}:${qty}`;
      return enqueueAddItem(key, async () => {
        const body = {
          menuItemId: menuItem.id,
          quantity: qty,
          modifierOptionIds: modifierOptionIds ?? [],
          note: noteKey || undefined,
        };
        const localFirst = isRestaurantLocalFirstOn();
        if (localFirst) {
          const local = await rstOfflineAddItem({
            orderId: String(oid),
            storeId,
            tableId: order?.tableId != null ? String(order.tableId) : null,
            tableLabel: order?.tableCode || openTable?.code || null,
            guestCount: order?.guestCount,
            waiterId: order?.waiterUserId != null ? String(order.waiterUserId) : null,
            serverId: order?.id != null ? String(order.id) : null,
            menuItemId: menuItem.id,
            name: menuItem.name,
            quantity: qty,
            unitPrice: Number(menuItem.price ?? menuItem.sellingPrice) || 0,
            note: noteKey || null,
            modifiers: (modifierOptionIds ?? []).map(String),
          });
          logLocalFirst('Добавление блюда (local-first)', {
            orderId: oid,
            menuItemId: menuItem.id,
          });
          return local.order;
        }
        const res = await rstOrderApi.addItem(oid, body);
        return res?.data !== undefined ? res.data : res;
      });
    },
    onMutate: async ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      const oid = isUsableOrderId(orderIdOverride)
        ? orderIdOverride
        : (isUsableOrderId(activeOrderId) ? activeOrderId : order?.id);
      if (!isUsableOrderId(oid)) return undefined;
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
      // Always refresh floor: waiter local orders must paint OCCUPIED before WAN sync.
      invalidateFloor();
      flushRestaurantPrintRelay();
    },
    onError: (err, vars) => {
      qc.invalidateQueries({ queryKey: orderKeyFor(vars?.orderId) });
      const msg = String(err?.message || '');
      if (msg === 'order_required' || msg === 'order required') {
        toast.error(t('rst.order.orderRequired', {
          defaultValue: 'Сначала откройте стол и добавьте блюдо',
        }));
        return;
      }
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity, note }) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      const body = {};
      if (quantity != null) body.quantity = quantity;
      if (note !== undefined) body.note = note;
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineUpdateItem({
          orderId: String(activeOrderId),
          itemId: String(itemId),
          quantity,
          note,
        });
        logLocalFirst('Изменение позиции (local-first)', { orderId: activeOrderId, itemId });
        return { data: local.order };
      }
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
    mutationFn: async (itemId) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflineCancelItem({
          orderId: String(activeOrderId),
          itemId: String(itemId),
        });
        logLocalFirst('Удаление позиции (local-first)', { orderId: activeOrderId, itemId });
        return { data: local.order };
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
    mutationFn: async (waiterUserId) => {
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflinePatchOrderMeta({
          orderId: String(activeOrderId),
          patch: 'WAITER',
          waiterId: waiterUserId,
        });
        logLocalFirst('Официант (local-first)', { orderId: activeOrderId, waiterUserId });
        void rstOrderApi.assignWaiter(activeOrderId, { waiterUserId }).catch(() => null);
        return local.order;
      }
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
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflinePatchOrderMeta({
          orderId: String(activeOrderId),
          patch: 'GUESTS',
          ...body,
        });
        logLocalFirst('Гости (local-first)', { orderId: activeOrderId, guestCount });
        void rstOrderApi.updateGuests(activeOrderId, body).catch(() => null);
        return local.order;
      }
      return rstOrderApi.updateGuests(activeOrderId, body).then((r) => r?.data ?? r);
    },
    onSuccess: (res) => { setOrderData(res); invalidateFloor(); },
    onError: (err) => errMsg(err, 'rst.order.saveFailed'),
  });

  const sendKitchenMutation = useMutation({
    mutationFn: async () => {
      const orderId = requireOrderId(activeOrderId, order?.id);
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        let categories = [];
        try {
          categories = (await rstMenuApi.listCategories(storeId, true))?.data || [];
        } catch {
          categories = await rstOfflineListCategories(storeId).catch(() => []) || [];
        }
        const local = await sendKitchenLocalFirst({
          order: { ...order, id: order?.id ?? orderId },
          storeId,
          categories,
          tableLabel: openTable?.code || order?.tableCode,
        });
        const needsRelay = Boolean(local?.needsRelay);
        // Satellite / missing Windows printers: outbox printOnServer creates relay jobs.
        // Do not also call classic send — that would double-print on the cashier.
        if (!needsRelay) {
          void rstOrderApi.sendToKitchen(orderId).catch(() => null);
        } else {
          // Flush phone outbox now so cashier relay can claim slips without waiting for poll.
          void tickWaiterOutbox({ storeId }).catch(() => null);
        }
        logLocalFirst('Кухня: local print + outbox', {
          orderId,
          printFailed: Boolean(local?.printFailed),
          needsRelay,
        });
        const items = (order?.items || []).map((item) => ({
          ...item,
          sentQuantity: item.quantity,
          itemStatus: item.itemStatus === 'NEW' ? 'SENT_TO_KITCHEN' : item.itemStatus,
        }));
        return {
          ...(local?.order || order),
          id: order?.id ?? orderId,
          items,
          // Only skip relay flush when this PC fully printed every station slip.
          _localPrinted: !needsRelay && !local?.printFailed,
          _localOnly: true,
          _printFailed: Boolean(local?.printFailed),
          _needsRelay: needsRelay,
        };
      }
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
      // Local-first already printed on this PC — do not claim server kitchen slips again.
      // Satellite needsRelay: kick relay so cashier/hub can claim as soon as jobs land.
      if (!res?._localPrinted) {
        flushRestaurantPrintRelay();
      }
      // Waiter phone: keep table OCCUPIED on floor after send (local overlay).
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

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        await rstOfflineCancelOrder({ orderId: String(activeOrderId) });
        logLocalFirst('Отмена заказа (local-first)', { orderId: activeOrderId });
        return true;
      }
      return rstOrderApi.cancel(activeOrderId);
    },
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
    mutationFn: async () => {
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        let printerName = '';
        try {
          const settings = await getDesktopPrinterSettings();
          printerName = String(settings?.billPrinterName || settings?.receiptPrinterName || '').trim();
        } catch {
          printerName = '';
        }
        const local = await rstOfflineRequestBill({
          orderId: String(activeOrderId),
          printerName,
          tableLabel: order?.tableCode || openTable?.code || null,
        });
        logLocalFirst('Счёт (local-first)', {
          orderId: activeOrderId,
          printOk: local.printOk !== false,
        });
        void rstOrderApi.requestBill(activeOrderId).catch(() => null);
        return { ...local.order, _local: true, _printFailed: local.printOk === false };
      }
      return rstOrderApi.requestBill(activeOrderId).then((r) => (r?.data !== undefined ? r.data : r));
    },
    onSuccess: (res) => {
      setOrderData(res);
      invalidateFloor();
      invalidateCounter();
      toast.success(t('rst.order.billRequested'));
      // Local-first: skip server guest-bill claim when offline; online mirror may still enqueue.
      if (!res?._local) {
        flushRestaurantPrintRelay();
      }
    },
    onError: (err) => errMsg(err, 'rst.order.billFailed'),
  });

  const discountMutation = useMutation({
    mutationFn: async (discountAmount) => {
      const localFirst = isRestaurantLocalFirstOn();
      if (localFirst) {
        const local = await rstOfflinePatchOrderMeta({
          orderId: String(activeOrderId),
          patch: 'DISCOUNT',
          discountAmount,
        });
        logLocalFirst('Скидка (local-first)', { orderId: activeOrderId, discountAmount });
        void rstOrderApi.updateDiscount(activeOrderId, { discountAmount }).catch(() => null);
        return local.order;
      }
      return rstOrderApi.updateDiscount(activeOrderId, { discountAmount }).then((r) => r?.data ?? r);
    },
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
