import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  isPosReceiptPrintEnabled,
  setPosReceiptPrintEnabled,
} from '../../../utils/receiptPrintPreference';
import {
  emptyGuestForm, emptyCounterForm, buildWaiters, buildWaiterNameById,
  resolveOrderHallName, computeCommissionPreview, resolveBackLabelKey, resolveOrderFlags,
} from '../utils/floorPosDerivations';
import { useFloorPosMutations } from './useFloorPosMutations';

export function useFloorPosPage() {
  const { t } = useTranslation();
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
  const storeId = workspace.storeId;

  const floorQuery = useQuery({
    queryKey: ['rst-floor', storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(storeId).then((r) => r.data),
    enabled: storeId != null && (posMode === 'floor' || !!activeOrderId),
    refetchInterval: activeOrderId || posMode !== 'floor' ? false : 15_000,
  });
  const counterQuery = useQuery({
    queryKey: ['rst-counter-orders', storeId, channel],
    queryFn: () => rstOrderApi.listActive(storeId, channel).then((r) => r.data),
    enabled: storeId != null && !!channel && !activeOrderId,
    refetchInterval: 10_000,
  });
  const shiftQuery = useQuery({
    queryKey: ['rst-shift-current', storeId],
    queryFn: async () => {
      const res = await rstShiftApi.current(storeId);
      return res.status === 204 ? null : res.data;
    },
    enabled: storeId != null,
    refetchInterval: 30_000,
  });
  const menuQuery = useQuery({
    queryKey: ['rst-menu-pos', storeId],
    queryFn: () => rstMenuApi.list(storeId, true).then((r) => r.data),
    enabled: storeId != null && !!activeOrderId,
  });
  const orderQuery = useQuery({
    queryKey: ['rst-order', activeOrderId],
    queryFn: () => rstOrderApi.get(activeOrderId).then((r) => r.data),
    enabled: !!activeOrderId,
  });
  const commissionQuery = useQuery({
    queryKey: ['rst-waiter-commission', storeId],
    queryFn: () => rstCommissionApi.getSettings(storeId).then((r) => r.data),
    enabled: storeId != null && !!activeOrderId,
  });
  const staffQuery = useQuery({
    queryKey: ['rst-pos-staff', storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: storeId != null,
    staleTime: 60_000,
  });
  const modifierQuery = useQuery({
    queryKey: ['rst-menu-modifiers', pendingMenuItem?.id],
    queryFn: () => rstModifierApi.listForMenuItem(pendingMenuItem.id).then((r) => r.data),
    enabled: !!pendingMenuItem?.id,
  });

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((hall) => hall.id === selectedHallId) ?? halls[0] ?? null;
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const shift = shiftQuery.data ?? null;
  const order = orderQuery.data;
  const orderHallName = useMemo(
    () => resolveOrderHallName(halls, order, selectedHall?.name),
    [halls, order, selectedHall?.name],
  );
  const waiters = useMemo(() => buildWaiters(staffQuery.data, storeId), [staffQuery.data, storeId]);
  const waiterNameById = useMemo(() => buildWaiterNameById(staffQuery.data), [staffQuery.data]);
  const commissionPreview = useMemo(
    () => computeCommissionPreview(order, commissionQuery.data),
    [order, commissionQuery.data],
  );
  const orderFlags = resolveOrderFlags(order);
  const shiftOpenLabel = shift?.openedAt ? formatShiftOpenDuration(shift.openedAt) : null;
  const backLabelKey = resolveBackLabelKey(posMode);

  const m = useFloorPosMutations({
    t, storeId, storeName: workspace.storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, commissionPreview, waiterNameById,
    user, printReceiptEnabled, setOpenTable, setActiveOrderId, setCounterModalOpen,
    setCounterForm, setShiftModal, setPendingMenuItem, setSelectedModifierIds, setPaidReceipt,
  });

  const ensureShift = () => {
    if (shift) return true;
    toast.error(t('rst.shift.required'));
    setShiftModal('open');
    setOpeningCash('0');
    return false;
  };

  const changePosMode = (mode) => {
    if (activeOrderId) setActiveOrderId(null);
    setPosMode(mode);
    setCounterModalOpen(false);
    setOpenTable(null);
  };

  const setPrintReceiptEnabled = (enabled) => {
    setPrintReceiptEnabledState(enabled);
    setPosReceiptPrintEnabled(enabled);
  };

  const handleTableClick = (table) => {
    const openOrderId = table.activeOrder?.id ?? table.activeOrderId;
    if (openOrderId) { setActiveOrderId(openOrderId); return; }
    if (table.status === 'BLOCKED') { toast.error(t('rst.order.blocked')); return; }
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
    if (order?.status === 'BILLING' || line.itemStatus !== 'NEW') return;
    if (nextQty < 1) { m.removeItemMutation.mutate(line.id); return; }
    m.updateItemMutation.mutate({ itemId: line.id, quantity: nextQty });
  };

  const handleAddItem = (menuItem) => {
    if (order?.status === 'BILLING') return;
    if (menuItem.modifierGroupIds?.length) {
      setPendingMenuItem(menuItem);
      setSelectedModifierIds([]);
      return;
    }
    m.addItemMutation.mutate({ menuItem, modifierOptionIds: [] });
  };

  const toggleModifier = (optionId) => {
    setSelectedModifierIds((current) => (
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    ));
  };

  return {
    t, workspace, posMode, changePosMode, channel,
    counterOrders: counterQuery.data ?? [],
    counterLoading: counterQuery.isPending,
    counterModalOpen, setCounterModalOpen, counterForm, setCounterForm,
    handleOpenCounter, openCounterMutation: m.openCounterMutation, handleFloorNewOrder,
    halls, selectedHall, orderHallName,
    selectedHallId: selectedHall?.id ?? null, setSelectedHallId,
    openTable, setOpenTable, guestForm, setGuestForm,
    activeOrderId, setActiveOrderId, order,
    menuItems: menuQuery.data ?? [],
    isLoading: workspace.isLoading || (posMode === 'floor' ? floorQuery.isLoading : counterQuery.isLoading),
    isError: posMode === 'floor' ? floorQuery.isError : counterQuery.isError,
    handleTableClick, handleAddItem,
    openMutation: m.openMutation, addItemMutation: m.addItemMutation, handleQty,
    removeItemMutation: m.removeItemMutation, cancelMutation: m.cancelMutation,
    sendKitchenMutation: m.sendKitchenMutation, billMutation: m.billMutation,
    payMutation: m.payMutation, printReceiptEnabled, setPrintReceiptEnabled,
    paidReceipt, closePaidReceipt: () => setPaidReceipt(null),
    refundMutation: m.refundMutation, pendingMenuItem,
    modifierGroups: modifierQuery.data ?? [], selectedModifierIds, toggleModifier,
    confirmModifiers: () => m.addItemMutation.mutate({
      menuItem: pendingMenuItem, modifierOptionIds: selectedModifierIds,
    }),
    closeModifiers: () => { setPendingMenuItem(null); setSelectedModifierIds([]); },
    canCancel: canManage || orderFlags.canCancel,
    canSendKitchen: orderFlags.canSendKitchen,
    canRequestBill: orderFlags.canRequestBill,
    canPay: orderFlags.canPay, canAdmin: canManage, backLabelKey,
    shift, shiftOpenLabel, floorSearch, setFloorSearch, waiters, waiterNameById,
    assignWaiterMutation: m.assignWaiterMutation,
    updateGuestsMutation: m.updateGuestsMutation, commissionPreview,
    shiftModal, setShiftModal, openingCash, setOpeningCash, closingCash, setClosingCash,
    openShiftMutation: m.openShiftMutation, closeShiftMutation: m.closeShiftMutation,
  };
}
