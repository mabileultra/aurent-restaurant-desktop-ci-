import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstFloorApi } from '../../api/floor.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { rstOrderApi } from '../../api/order.api';
import { rstShiftApi } from '../../api/shift.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';

const emptyGuestForm = () => ({ guestCount: 2, adultCount: 2, childrenCount: 0 });

export function useFloorPosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const workspace = useRestaurantWorkspaceStore();
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [openTable, setOpenTable] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [shiftModal, setShiftModal] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');

  const floorQuery = useQuery({
    queryKey: ['rst-floor', workspace.storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
    refetchInterval: activeOrderId ? false : 15_000,
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

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((hall) => hall.id === selectedHallId) ?? halls[0] ?? null;
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const shift = shiftQuery.data ?? null;

  const invalidateFloor = () => qc.invalidateQueries({ queryKey: ['rst-floor', workspace.storeId] });
  const invalidateShift = () => qc.invalidateQueries({ queryKey: ['rst-shift-current', workspace.storeId] });

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
      toast.success(t('rst.order.billRequested'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.billFailed')),
  });

  const payMutation = useMutation({
    mutationFn: (method) => rstOrderApi.pay(activeOrderId, {
      method,
      amount: orderQuery.data?.subtotal,
    }),
    onSuccess: () => {
      setActiveOrderId(null);
      invalidateFloor();
      invalidateShift();
      toast.success(t('rst.order.paid'));
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.order.payFailed')),
  });

  const handleTableClick = (table) => {
    if (table.activeOrderId) {
      setActiveOrderId(table.activeOrderId);
      return;
    }
    if (table.status === 'BLOCKED') {
      toast.error(t('rst.order.blocked'));
      return;
    }
    if (!shift) {
      toast.error(t('rst.shift.required'));
      setShiftModal('open');
      setOpeningCash('0');
      return;
    }
    if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') {
      toast.error(t('rst.order.alreadyOpen'));
      return;
    }
    setGuestForm(emptyGuestForm());
    setOpenTable(table);
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

  return {
    t,
    workspace,
    halls,
    selectedHall,
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
    isLoading: workspace.isLoading || floorQuery.isLoading,
    isError: floorQuery.isError,
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
    shift,
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
