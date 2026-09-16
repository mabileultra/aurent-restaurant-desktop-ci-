import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { rstFloorApi } from '../../api/floor.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { rstOrderApi } from '../../api/order.api';
import { rstShiftApi } from '../../api/shift.api';
import { rstCommissionApi } from '../../api/commission.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';
import { formatShiftOpenDuration } from '../utils/formatElapsed';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import {
  isPosReceiptPrintEnabled,
  setPosReceiptPrintEnabled,
} from '../../../utils/receiptPrintPreference';
import { payRestaurantOrderWithFiscal } from '../utils/payRestaurantOrderWithFiscal';
import { restaurantPayTotal } from '../utils/buildRestaurantFiscalSale';

function userStoreIds(user) {
  if (Array.isArray(user.storeIds)) return user.storeIds.map(Number);
  if (Array.isArray(user.stores)) {
    return user.stores.map((s) => Number(s && typeof s === 'object' ? s.id : s));
  }
  return [];
}

function displayUserName(user) {
  return user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || String(user.id);
}


const emptyGuestForm = () => ({ guestCount: 2, adultCount: 2, childrenCount: 0 });
const emptyCounterForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
});

export function useFloorPosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const workspace = useRestaurantWorkspaceStore();
  const [posMode, setPosMode] = useState('floor');
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [openTable, setOpenTable] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterForm, setCounterForm] = useState(emptyCounterForm());
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [shiftModal, setShiftModal] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [floorSearch, setFloorSearch] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabledState] = useState(() => isPosReceiptPrintEnabled());
  const [paidReceipt, setPaidReceipt] = useState(null);

  const channel = posMode === 'takeaway' ? 'TAKEAWAY' : posMode === 'delivery' ? 'DELIVERY' : null;

  const floorQuery = useQuery({
    queryKey: ['rst-floor', workspace.storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null && (posMode === 'floor' || !!activeOrderId),
    refetchInterval: activeOrderId || posMode !== 'floor' ? false : 15_000,
  });

  const counterQuery = useQuery({
    queryKey: ['rst-counter-orders', workspace.storeId, channel],
    queryFn: () => rstOrderApi.listActive(workspace.storeId, channel).then((r) => r.data),
    enabled: workspace.storeId != null && !!channel && !activeOrderId,
    refetchInterval: 10_000,
  });

  const shiftQuery = useQuery({
    queryKey: ['rst-shift-current', workspace.storeId],
    queryFn: async () => {
      const res = await rstShiftApi.current(workspace.storeId);
      return res.status === 204 ? null : res.data;
    },
    enabled: workspace.storeId != null,
    refetchInterval: 30_000,
  });

  const menuQuery = useQuery({
    queryKey: ['rst-menu-pos', workspace.storeId],
    queryFn: () => rstMenuApi.list(workspace.storeId, true).then((r) => r.data),
    enabled: workspace.storeId != null && !!activeOrderId,
  });

  const orderQuery = useQuery({
    queryKey: ['rst-order', activeOrderId],
    queryFn: () => rstOrderApi.get(activeOrderId).then((r) => r.data),
    enabled: !!activeOrderId,
  });

  const commissionQuery = useQuery({
    queryKey: ['rst-waiter-commission', workspace.storeId],
    queryFn: () => rstCommissionApi.getSettings(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null && !!activeOrderId,
  });

  const staffQuery = useQuery({
    queryKey: ['rst-pos-staff', workspace.storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
  });

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((hall) => hall.id === selectedHallId) ?? halls[0] ?? null;
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const shift = shiftQuery.data ?? null;
  const order = orderQuery.data;

  const orderHallName = useMemo(() => {
    if (!order?.tableId) return selectedHall?.name ?? null;
    for (const hall of halls) {
      if ((hall.tables ?? []).some((table) => table.id === order.tableId)) {
        return hall.name;
      }
    }
    return selectedHall?.name ?? null;
  }, [halls, order?.tableId, selectedHall?.name]);

  const waiters = useMemo(() => {
    const storeId = workspace.storeId;
    if (storeId == null) return [];
    return (staffQuery.data ?? [])
      .filter((row) => row.role === 'WAITER' && row.active !== false)
      .filter((row) => userStoreIds(row).includes(Number(storeId)))
      .map((row) => ({ id: row.id, name: displayUserName(row) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staffQuery.data, workspace.storeId]);

  const waiterNameById = useMemo(() => {
    const map = new Map();
    for (const row of staffQuery.data ?? []) {
      map.set(String(row.id), displayUserName(row));
    }
    return map;
  }, [staffQuery.data]);

  const commissionPreview = useMemo(() => {
    if (!order || order.channel !== 'DINE_IN') return null;
    if (order.commissionPercent != null) {
      return {
        percent: Number(order.commissionPercent),
        amount: Number(order.commissionAmount ?? 0),
      };
    }
    const settings = commissionQuery.data;
    if (!settings) return null;
    const waiterId = order.waiterUserId ? String(order.waiterUserId) : null;
    const override = (settings.overrides ?? []).find((row) => String(row.userId) === waiterId);
    const percent = Number(override?.percent ?? settings.defaultPercent ?? 0);
    const subtotal = Number(order.subtotal ?? 0);
    const amount = Math.round(((subtotal * percent) / 100) * 100) / 100;
    return { percent, amount };
  }, [order, commissionQuery.data]);

  const shiftOpenLabel = shift?.openedAt
    ? formatShiftOpenDuration(shift.openedAt)
    : null;

  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', workspace.storeId] });
  const invalidateCounter = () => qc.invalidateQueries({ queryKey: ['rst-counter-orders', workspace.storeId] });
  const invalidateShift = () => qc.invalidateQueries({ queryKey: ['rst-shift-current', workspace.storeId] });

  const ensureShift = () => {
    if (shift) return true;
    toast.error(t('rst.shift.required'));
    setShiftModal('open');
    setOpeningCash('0');
    return false;
  };

  const changePosMode = (mode) => {
    if (activeOrderId) {
      setActiveOrderId(null);
    }
    setPosMode(mode);
    setCounterModalOpen(false);
    setOpenTable(null);
  };

  const openMutation = useMutation({
    mutationFn: () => {
      const guestCount = Math.max(1, Number(guestForm.guestCount) || 1);
      const childrenCount = Math.min(Math.max(0, Number(guestForm.childrenCount) || 0), guestCount);
      const adultCount = guestCount - childrenCount;
      return rstOrderApi.open(openTable.id, { guestCount, adultCount, childrenCount }).then((r) => r.data);
    },
    onSuccess: (order) => {
      setOpenTable(null);
      setActiveOrderId(order.id);
      invalidateFloor();
      invalidateShift();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.openFailed')),
  });

  const openCounterMutation = useMutation({
    mutationFn: () => {
      const payload = {
        clientName: counterForm.clientName.trim() || undefined,
        clientPhone: counterForm.clientPhone.trim() || undefined,
        deliveryAddress: counterForm.deliveryAddress.trim() || undefined,
        comment: counterForm.comment.trim() || undefined,
      };
      if (channel === 'DELIVERY') {
        return rstOrderApi.openDelivery(workspace.storeId, payload).then((r) => r.data);
      }
      return rstOrderApi.openTakeaway(workspace.storeId, payload).then((r) => r.data);
    },
    onSuccess: (order) => {
      setCounterModalOpen(false);
      setCounterForm(emptyCounterForm());
      setActiveOrderId(order.id);
      invalidateCounter();
      invalidateShift();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.openFailed')),
  });

  const openShiftMutation = useMutation({
    mutationFn: () => rstShiftApi.open(workspace.storeId, {
      openingCash: Number(openingCash) || 0,
    }).then((r) => r.data),
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.opened'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.shift.openFailed')),
  });

  const closeShiftMutation = useMutation({
    mutationFn: () => rstShiftApi.close(shift.id, {
      closingCash: Number(closingCash) || 0,
    }).then((r) => r.data),
    onSuccess: () => {
      setShiftModal(null);
      invalidateShift();
      toast.success(t('rst.shift.closed'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.shift.closeFailed')),
  });

  const modifierQuery = useQuery({
    queryKey: ['rst-menu-modifiers', pendingMenuItem?.id],
    queryFn: () => rstModifierApi.listForMenuItem(pendingMenuItem.id).then((r) => r.data),
    enabled: !!pendingMenuItem?.id,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ menuItem, modifierOptionIds }) => rstOrderApi.addItem(activeOrderId, {
      menuItemId: menuItem.id,
      quantity: 1,
      modifierOptionIds: modifierOptionIds ?? [],
    }),
    onSuccess: (res) => {
      qc.setQueryData(['rst-order', activeOrderId], res.data);
      setPendingMenuItem(null);
      setSelectedModifierIds([]);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.saveFailed')),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => rstOrderApi.updateItem(activeOrderId, itemId, { quantity }),
    onSuccess: (res) => qc.setQueryData(['rst-order', activeOrderId], res.data),
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.saveFailed')),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => rstOrderApi.removeItem(activeOrderId, itemId),
    onSuccess: (res) => qc.setQueryData(['rst-order', activeOrderId], res.data),
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.saveFailed')),
  });

  const assignWaiterMutation = useMutation({
    mutationFn: (waiterUserId) => rstOrderApi.assignWaiter(activeOrderId, { waiterUserId }),
    onSuccess: (res) => {
      qc.setQueryData(['rst-order', activeOrderId], res.data);
      invalidateFloor();
      toast.success(t('rst.order.waiterAssigned'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.waiterAssignFailed')),
  });

  const updateGuestsMutation = useMutation({
    mutationFn: (guestCount) => rstOrderApi.updateGuests(activeOrderId, {
      guestCount,
      adultCount: guestCount,
      childrenCount: 0,
    }),
    onSuccess: (res) => {
      qc.setQueryData(['rst-order', activeOrderId], res.data);
      invalidateFloor();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.saveFailed')),
  });

  const sendKitchenMutation = useMutation({
    mutationFn: () => rstOrderApi.sendToKitchen(activeOrderId),
    onSuccess: (res) => {
      qc.setQueryData(['rst-order', activeOrderId], res.data);
      toast.success(t('rst.order.sentKitchen'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.sendFailed')),
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
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.cancelFailed')),
  });

  const billMutation = useMutation({
    mutationFn: () => rstOrderApi.requestBill(activeOrderId),
    onSuccess: (res) => {
      qc.setQueryData(['rst-order', activeOrderId], res.data);
      invalidateFloor();
      invalidateCounter();
      toast.success(t('rst.order.billRequested'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.billFailed')),
  });

  const setPrintReceiptEnabled = (enabled) => {
    setPrintReceiptEnabledState(enabled);
    setPosReceiptPrintEnabled(enabled);
  };

  const payMutation = useMutation({
    mutationFn: async ({ method, amount }) => {
      const currentOrder = orderQuery.data;
      if (!currentOrder?.id) {
        throw new Error('ORDER_MISSING');
      }
      const orderForPay = {
        ...currentOrder,
        commissionPercent:
          currentOrder.commissionPercent != null
            ? currentOrder.commissionPercent
            : (commissionPreview?.percent ?? 0),
        commissionAmount:
          currentOrder.commissionAmount != null
            ? currentOrder.commissionAmount
            : (currentOrder.channel === 'DINE_IN' ? (commissionPreview?.amount ?? 0) : 0),
      };
      const waiterName = orderForPay.waiterUserId
        ? waiterNameById.get(String(orderForPay.waiterUserId))
        : null;
      const customerLabel = orderForPay.channel === 'DINE_IN'
        ? (orderForPay.tableCode
          ? t('rst.order.receiptTable', { code: orderForPay.tableCode })
          : null)
        : (orderForPay.clientName || null);
      const serviceLabel = orderForPay.channel === 'DINE_IN' && Number(orderForPay.commissionAmount) > 0
        ? t('rst.order.serviceLine', {
          percent: Number(orderForPay.commissionPercent ?? 0),
        })
        : null;

      return payRestaurantOrderWithFiscal({
        order: orderForPay,
        method,
        amount: amount ?? restaurantPayTotal(orderForPay),
        storeId: workspace.storeId,
        storeName: workspace.storeName,
        shiftId: shift?.id ?? null,
        cashRegisterId: shift?.cashRegisterId ?? null,
        cashierName: user?.fullName || user?.username || undefined,
        waiterName,
        customerLabel,
        serviceLabel,
        t,
      });
    },
    onSuccess: async ({ sale }) => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      toast.success(t('rst.order.paid'));

      // Показать чек сразу; печать ESC/POS — параллельно, чтобы UI не ждал принтер.
      const shouldPrint = printReceiptEnabled;
      setPaidReceipt({
        sale,
        autoPrint: shouldPrint && !isCashierEscposPrintAvailable(),
      });

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
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.refundFailed')),
  });

  const closePaidReceipt = () => setPaidReceipt(null);

  const handleTableClick = (table) => {
    const openOrderId = table.activeOrder?.id ?? table.activeOrderId;
    if (openOrderId) {
      setActiveOrderId(openOrderId);
      return;
    }
    if (table.status === 'BLOCKED') {
      toast.error(t('rst.order.blocked'));
      return;
    }
    if (!ensureShift()) return;
    if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') {
      toast.error(t('rst.order.alreadyOpen'));
      return;
    }
    setGuestForm(emptyGuestForm());
    setOpenTable(table);
  };

  const handleOpenCounter = () => {
    if (!ensureShift()) return;
    setCounterForm(emptyCounterForm());
    setCounterModalOpen(true);
  };

  const handleFloorNewOrder = () => {
    if (!ensureShift()) return;
    setActiveOrderId(null);
    setPosMode('takeaway');
    setOpenTable(null);
    setCounterForm(emptyCounterForm());
    setCounterModalOpen(true);
  };

  const handleQty = (line, nextQty) => {
    if (orderQuery.data?.status === 'BILLING' || line.itemStatus !== 'NEW') return;
    if (nextQty < 1) {
      removeItemMutation.mutate(line.id);
      return;
    }
    updateItemMutation.mutate({ itemId: line.id, quantity: nextQty });
  };

  const handleAddItem = (menuItem) => {
    if (orderQuery.data?.status === 'BILLING') return;
    if (menuItem.modifierGroupIds?.length) {
      setPendingMenuItem(menuItem);
      setSelectedModifierIds([]);
      return;
    }
    addItemMutation.mutate({ menuItem, modifierOptionIds: [] });
  };

  const toggleModifier = (optionId) => {
    setSelectedModifierIds((current) => (
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    ));
  };

  const canCancel = canManage || (orderQuery.data?.items ?? []).length === 0;
  const canSendKitchen = orderQuery.data?.status === 'OPEN'
    && (orderQuery.data?.items ?? []).some((item) => item.itemStatus === 'NEW');
  const canRequestBill = orderQuery.data?.status === 'OPEN'
    && (orderQuery.data?.items ?? []).some((item) => item.itemStatus !== 'CANCELLED')
    && !(orderQuery.data?.items ?? []).some((item) => item.itemStatus === 'NEW');
  const canPay = orderQuery.data?.status === 'BILLING';

  const backLabelKey = posMode === 'takeaway'
    ? 'rst.pos.backToTakeaway'
    : posMode === 'delivery'
      ? 'rst.pos.backToDelivery'
      : 'rst.order.backToFloor';

  return {
    t,
    workspace,
    posMode,
    changePosMode,
    channel,
    counterOrders: counterQuery.data ?? [],
    counterLoading: counterQuery.isPending,
    counterModalOpen,
    setCounterModalOpen,
    counterForm,
    setCounterForm,
    handleOpenCounter,
    openCounterMutation,
    handleFloorNewOrder,
    halls,
    selectedHall,
    orderHallName,
    selectedHallId: selectedHall?.id ?? null,
    setSelectedHallId,
    openTable,
    setOpenTable,
    guestForm,
    setGuestForm,
    activeOrderId,
    setActiveOrderId,
    order: orderQuery.data,
    menuItems: menuQuery.data ?? [],
    isLoading: workspace.isLoading || (posMode === 'floor' ? floorQuery.isLoading : counterQuery.isLoading),
    isError: posMode === 'floor' ? floorQuery.isError : counterQuery.isError,
    handleTableClick,
    handleAddItem,
    openMutation,
    addItemMutation,
    handleQty,
    removeItemMutation,
    cancelMutation,
    sendKitchenMutation,
    billMutation,
    payMutation,
    printReceiptEnabled,
    setPrintReceiptEnabled,
    paidReceipt,
    closePaidReceipt,
    refundMutation,
    pendingMenuItem,
    modifierGroups: modifierQuery.data ?? [],
    selectedModifierIds,
    toggleModifier,
    confirmModifiers: () => addItemMutation.mutate({
      menuItem: pendingMenuItem,
      modifierOptionIds: selectedModifierIds,
    }),
    closeModifiers: () => {
      setPendingMenuItem(null);
      setSelectedModifierIds([]);
    },
    canCancel,
    canSendKitchen,
    canRequestBill,
    canPay,
    canAdmin: canManage,
    backLabelKey,
    shift,
    shiftOpenLabel,
    floorSearch,
    setFloorSearch,
    waiters,
    waiterNameById,
    assignWaiterMutation,
    updateGuestsMutation,
    commissionPreview,
    shiftModal,
    setShiftModal,
    openingCash,
    setOpeningCash,
    closingCash,
    setClosingCash,
    openShiftMutation,
    closeShiftMutation,
  };
}
