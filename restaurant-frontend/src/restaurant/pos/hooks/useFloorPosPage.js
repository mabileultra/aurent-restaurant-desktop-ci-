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
import { ALL_HALLS_ID, collectHallTables } from '../utils/floorStatusFilters';
import { resolveFloorAccess } from '../utils/floorRoleAccess';
import { useFloorPosMutations } from './useFloorPosMutations';
import { useFloorTableActions } from './useFloorTableActions';

const COUNTER_STALE_MS = 15_000;
const FLOOR_STALE_MS = 12_000;
const SHIFT_STALE_MS = 20_000;

export function useFloorPosPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const workspace = useRestaurantWorkspaceStore();
  const access = resolveFloorAccess(user?.role);
  const [posMode, setPosMode] = useState('floor');
  const [floorSection, setFloorSection] = useState('tables');
  const [selectedHallId, setSelectedHallId] = useState(ALL_HALLS_ID);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openTable, setOpenTable] = useState(null);
  const [reservedTable, setReservedTable] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterForm, setCounterForm] = useState(emptyCounterForm());
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [pendingItemNote, setPendingItemNote] = useState('');
  const [lineNoteEdit, setLineNoteEdit] = useState(null);
  const [shiftModal, setShiftModal] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [floorSearch, setFloorSearch] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabledState] = useState(() => isPosReceiptPrintEnabled());
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const channel = posMode === 'takeaway' ? 'TAKEAWAY' : posMode === 'delivery' ? 'DELIVERY' : null;
  const storeId = workspace.storeId;
  const onFloor = posMode === 'floor';

  const floorQuery = useQuery({
    queryKey: ['rst-floor', storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(storeId).then((r) => r.data),
    enabled: storeId != null && (onFloor || !!activeOrderId),
    staleTime: FLOOR_STALE_MS,
    refetchInterval: activeOrderId || !onFloor ? false : 15_000,
  });
  const counterQuery = useQuery({
    queryKey: ['rst-counter-orders', storeId, channel],
    queryFn: () => rstOrderApi.listActive(storeId, channel).then((r) => r.data),
    enabled: storeId != null && !!channel && !activeOrderId,
    staleTime: COUNTER_STALE_MS,
    refetchInterval: 10_000,
  });
  const shiftQuery = useQuery({
    queryKey: ['rst-shift-current', storeId],
    queryFn: async () => {
      const res = await rstShiftApi.current(storeId);
      return res.status === 204 ? null : res.data;
    },
    enabled: storeId != null,
    staleTime: SHIFT_STALE_MS,
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
  const selectedHall = selectedHallId === ALL_HALLS_ID
    ? null
    : (halls.find((hall) => hall.id === selectedHallId) ?? halls[0] ?? null);
  const hallTables = collectHallTables(halls, selectedHallId);
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
    setCounterForm, setShiftModal, setPendingMenuItem, setSelectedModifierIds, setPendingItemNote,
    setPaidReceipt, closePayModal: () => setPayModalOpen(false),
  });

  const tableActions = useFloorTableActions({
    t,
    storeId,
    halls,
    waiterNameById,
    access,
    setActiveOrderId,
  });

  const ensureShift = () => {
    if (shift) return true;
    toast.error(t('rst.shift.required'));
    setShiftModal(true);
    return false;
  };

  const changePosMode = (mode) => {
    if (!access.canCounterSales && mode !== 'floor') return;
    if (activeOrderId) setActiveOrderId(null);
    setPosMode(mode);
    setCounterModalOpen(false);
    setOpenTable(null);
    setReservedTable(null);
    tableActions.closeInspect();
    if (mode === 'floor') setFloorSection('tables');
  };

  const setPrintReceiptEnabled = (enabled) => {
    setPrintReceiptEnabledState(enabled);
    setPosReceiptPrintEnabled(enabled);
  };

  const beginOpenTable = (table) => {
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    setGuestForm(emptyGuestForm());
    setOpenTable(table);
    setReservedTable(null);
  };

  const handleTableClick = (table) => {
    const openOrderId = table.activeOrder?.id ?? table.activeOrderId;
    if (openOrderId) {
      tableActions.openOccupied(table);
      return;
    }
    if (table.status === 'BLOCKED') { toast.error(t('rst.order.blocked')); return; }
    if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') {
      toast.error(t('rst.order.alreadyOpen'));
      return;
    }
    if (table.status === 'CLEANING') {
      if (!m.markReadyMutation.isPending) {
        m.markReadyMutation.mutate(table.id);
      }
      return;
    }
    if (table.status === 'RESERVED' || table.reservation) {
      setReservedTable(table);
      return;
    }
    beginOpenTable(table);
  };

  const handleOpenCounter = () => {
    if (!access.canCounterSales) return;
    if (!ensureShift()) return;
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
    setPendingMenuItem(menuItem);
    setSelectedModifierIds([]);
    setPendingItemNote('');
  };

  const toggleModifier = (optionId) => {
    setSelectedModifierIds((current) => (
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    ));
  };

  const openLineNote = (line) => {
    setLineNoteEdit({ id: line.id, name: line.name, note: line.note || '' });
  };

  const saveLineNote = () => {
    if (!lineNoteEdit) return;
    const line = order?.items?.find((row) => row.id === lineNoteEdit.id);
    if (!line) return;
    m.updateItemMutation.mutate(
      {
        itemId: lineNoteEdit.id,
        quantity: line.quantity,
        note: lineNoteEdit.note,
      },
      { onSuccess: () => setLineNoteEdit(null) },
    );
  };

  return {
    t, user, workspace, access,
    posMode, changePosMode, channel,
    floorSection, setFloorSection,
    counterOrders: counterQuery.data ?? [],
    counterLoading: counterQuery.isPending && !counterQuery.data,
    counterModalOpen, setCounterModalOpen, counterForm, setCounterForm,
    handleOpenCounter, openCounterMutation: m.openCounterMutation,
    halls, selectedHall, hallTables, orderHallName,
    selectedHallId, setSelectedHallId,
    statusFilter, setStatusFilter,
    openTable, setOpenTable, reservedTable, setReservedTable, beginOpenTable,
    guestForm, setGuestForm,
    activeOrderId, setActiveOrderId, order,
    menuItems: menuQuery.data ?? [],
    isLoading: workspace.isLoading || (onFloor ? floorQuery.isLoading : counterQuery.isLoading),
    isError: onFloor ? floorQuery.isError : counterQuery.isError,
    handleTableClick, handleAddItem,
    openMutation: m.openMutation, addItemMutation: m.addItemMutation, handleQty,
    removeItemMutation: m.removeItemMutation, cancelMutation: m.cancelMutation,
    sendKitchenMutation: m.sendKitchenMutation, billMutation: m.billMutation,
    discountMutation: m.discountMutation,
    payMutation: m.payMutation, printReceiptEnabled, setPrintReceiptEnabled,
    paidReceipt, closePaidReceipt: () => setPaidReceipt(null),
    payModalOpen, openPayModal: () => setPayModalOpen(true),
    closePayModal: () => setPayModalOpen(false),
    refundMutation: m.refundMutation, pendingMenuItem,
    pendingItemNote, setPendingItemNote,
    modifierGroups: modifierQuery.data ?? [], selectedModifierIds, toggleModifier,
    confirmModifiers: () => m.addItemMutation.mutate({
      menuItem: pendingMenuItem,
      modifierOptionIds: selectedModifierIds,
      note: pendingItemNote,
    }),
    closeModifiers: () => {
      setPendingMenuItem(null);
      setSelectedModifierIds([]);
      setPendingItemNote('');
    },
    lineNoteEdit,
    setLineNoteEdit,
    openLineNote,
    saveLineNote,
    lineNotePending: m.updateItemMutation.isPending,
    canCancel: access.canCancelOrder || orderFlags.canCancel,
    canSendKitchen: orderFlags.canSendKitchen,
    canRequestBill: orderFlags.canRequestBill,
    canPay: access.canPay && orderFlags.canPay,
    canAdmin: access.canConfigureHall,
    backLabelKey,
    shift, shiftOpenLabel, floorSearch, setFloorSearch, waiters, waiterNameById,
    assignWaiterMutation: m.assignWaiterMutation,
    updateGuestsMutation: m.updateGuestsMutation, commissionPreview,
    shiftModal, setShiftModal, openingCash, setOpeningCash, closingCash, setClosingCash,
    openShiftMutation: m.openShiftMutation, closeShiftMutation: m.closeShiftMutation,
    tableActions,
  };
}
