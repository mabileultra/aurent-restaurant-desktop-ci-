import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { rstFloorApi } from '../../api/floor.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { rstOrderApi } from '../../api/order.api';
import { rstShiftApi } from '../../api/shift.api';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useAuthStore } from '../../../store/authStore';
import { formatShiftOpenDuration } from '../utils/formatElapsed';
import {
  emptyGuestForm, emptyCounterForm, buildWaiters, buildWaiterNameById,
  resolveOrderHallName, resolveBackLabelKey, resolveOrderFlags,
} from '../utils/floorPosDerivations';
import { resolveServicePreview } from '../utils/restaurantPayAmount';
import { ALL_HALLS_ID, collectHallTables } from '../utils/floorStatusFilters';
import { orderPlaceholderFromFloor } from '../utils/orderFloorPlaceholder';
import { resolveFloorAccess } from '../utils/floorRoleAccess';
import { isWeightSoldMenuItem } from '../utils/menuWeightSale';
import { useFloorPosMutations } from './useFloorPosMutations';
import { useFloorTableActions } from './useFloorTableActions';
import { useStoreFloorSync } from './useStoreFloorSync';

const COUNTER_STALE_MS = 15_000;
const FLOOR_STALE_MS = 8_000;
const SHIFT_STALE_MS = 20_000;
const MENU_STALE_MS = 10 * 60_000;
const ORDER_STALE_MS = 3_000;
/** Fallback if revision poll misses; primary sync is useStoreFloorSync (~2s watermark). */
const FLOOR_POLL_MS = 20_000;
const ORDER_POLL_MS = 12_000;

function draftOrderFromTable(table) {
  if (!table) return null;
  return {
    id: null,
    orderNo: '—',
    status: 'OPEN',
    channel: 'DINE_IN',
    tableId: table.id,
    tableCode: table.code,
    guestCount: 1,
    adultCount: 1,
    childrenCount: 0,
    subtotal: 0,
    discountAmount: 0,
    waiterUserId: null,
    openedAt: null,
    items: [],
    _draft: true,
  };
}

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
  const [pendingVariants, setPendingVariants] = useState(null);
  const [pendingWeightItem, setPendingWeightItem] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [pendingItemNote, setPendingItemNote] = useState('');
  const [lineNoteEdit, setLineNoteEdit] = useState(null);
  const [shiftModal, setShiftModal] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [floorSearch, setFloorSearch] = useState('');
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [draftTable, setDraftTable] = useState(null);
  const draftTableRef = useRef(null);
  const openingRef = useRef(false);

  const channel = posMode === 'takeaway' ? 'TAKEAWAY' : posMode === 'delivery' ? 'DELIVERY' : null;
  const storeId = workspace.storeId;
  const qc = useQueryClient();
  const onFloor = posMode === 'floor';

  useStoreFloorSync(storeId, { activeOrderId });

  const floorQuery = useQuery({
    queryKey: ['rst-floor', storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(storeId).then((r) => r.data),
    enabled: storeId != null && (onFloor || !!activeOrderId),
    staleTime: FLOOR_STALE_MS,
    // Keep polling on the board even when a ticket is open (phone / other POS edits).
    refetchInterval: onFloor || activeOrderId ? FLOOR_POLL_MS : false,
    refetchOnWindowFocus: true,
  });
  const counterQuery = useQuery({
    queryKey: ['rst-counter-orders', storeId, channel],
    queryFn: () => rstOrderApi.listActive(storeId, channel).then((r) => r.data),
    enabled: storeId != null && !!channel && !activeOrderId,
    staleTime: COUNTER_STALE_MS,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
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
    enabled: storeId != null,
    staleTime: MENU_STALE_MS,
  });
  const floorHalls = floorQuery.data?.halls;
  const orderFloorSeed = useMemo(
    () => (activeOrderId ? orderPlaceholderFromFloor(floorHalls, activeOrderId) : undefined),
    [floorHalls, activeOrderId],
  );
  const orderQuery = useQuery({
    queryKey: ['rst-order', activeOrderId],
    queryFn: () => rstOrderApi.get(activeOrderId).then((r) => r.data),
    enabled: !!activeOrderId,
    staleTime: ORDER_STALE_MS,
    refetchInterval: activeOrderId ? ORDER_POLL_MS : false,
    refetchOnWindowFocus: true,
    placeholderData: orderFloorSeed,
  });
  const staffQuery = useQuery({
    queryKey: ['rst-pos-staff', storeId],
    queryFn: () => userApi.getPosRoster(storeId).then((r) => r.data ?? []),
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
  const orderPartial = !!activeOrderId && !!order && orderQuery.isPlaceholderData;
  const orderHallName = useMemo(
    () => resolveOrderHallName(halls, order, selectedHall?.name),
    [halls, order, selectedHall?.name],
  );
  const waiters = useMemo(() => buildWaiters(staffQuery.data, storeId), [staffQuery.data, storeId]);
  const waiterNameById = useMemo(() => buildWaiterNameById(staffQuery.data), [staffQuery.data]);
  const servicePreview = useMemo(
    () => resolveServicePreview(order, halls),
    [order, halls],
  );
  const kitchenBoardQuery = useQuery({
    queryKey: ['rst-kitchen-board', storeId],
    queryFn: () => rstKitchenApi.getKitchenBoard(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 15_000,
  });
  const kitchenBoardEnabled = kitchenBoardQuery.data?.enabled !== false;
  const rawFlags = resolveOrderFlags(order, kitchenBoardEnabled);
  const orderFlags = orderPartial
    ? {
      ...rawFlags,
      canCancel: false,
      canSendKitchen: false,
      canRequestBill: false,
      canPay: false,
    }
    : rawFlags;
  const shiftOpenLabel = shift?.openedAt ? formatShiftOpenDuration(shift.openedAt) : null;
  const backLabelKey = resolveBackLabelKey(posMode);

  const prefetchOrder = (orderId) => {
    if (!orderId) return;
    qc.prefetchQuery({
      queryKey: ['rst-order', orderId],
      queryFn: () => rstOrderApi.get(orderId).then((r) => r.data),
      staleTime: ORDER_STALE_MS,
    });
  };

  const m = useFloorPosMutations({
    t, storeId, storeName: workspace.storeName, channel, guestForm, openTable, counterForm,
    openingCash, closingCash, shift, activeOrderId, order, servicePreview, waiterNameById,
    user, setOpenTable, setActiveOrderId, setCounterModalOpen,
    setCounterForm, setShiftModal, setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote,
    setPendingWeightItem,
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

  const clearDraft = () => {
    draftTableRef.current = null;
    setDraftTable(null);
  };

  const changePosMode = (mode) => {
    if (!access.canCounterSales && mode !== 'floor') return;
    if (activeOrderId) setActiveOrderId(null);
    clearDraft();
    setPosMode(mode);
    setCounterModalOpen(false);
    setOpenTable(null);
    setReservedTable(null);
    tableActions.closeInspect();
    if (mode === 'floor') setFloorSection('tables');
  };

  /** Free table: select + menu only; order opens on first dish (like cashier). */
  const beginDraftTable = (table) => {
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    if (!table?.id) return;
    setReservedTable(null);
    setOpenTable(null);
    tableActions.closeInspect();
    draftTableRef.current = table;
    setDraftTable(table);
    setActiveOrderId(null);
  };

  /** Reserved seat / explicit open — creates the order immediately. */
  const beginOpenTable = (table) => {
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    if (!table?.id || m.openMutation.isPending) return;
    clearDraft();
    setReservedTable(null);
    setOpenTable(null);
    m.openMutation.mutate({ table, guestCount: 1, childrenCount: 0 });
  };

  const openExtraCheck = (table, seed = {}) => {
    if (!table?.id) return;
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      return;
    }
    if (!ensureShift()) return;
    if (m.openExtraCheckMutation.isPending) return;
    clearDraft();
    tableActions.closeInspect();
    setReservedTable(null);
    setOpenTable(null);
    m.openExtraCheckMutation.mutate({
      tableId: table.id,
      guestCount: seed.guestCount,
      waiterUserId: seed.waiterUserId,
    });
  };

  const handleTableClick = (table) => {
    const openOrderId = table.activeOrder?.id ?? table.activeOrderId;
    if (openOrderId) {
      clearDraft();
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
    beginDraftTable(table);
  };

  const handleOpenCounter = () => {
    if (!access.canCounterSales) return;
    if (!ensureShift()) return;
    setCounterForm(emptyCounterForm());
    setCounterModalOpen(true);
  };

  const handleQty = (line, nextQty) => {
    const isNew = line.itemStatus === 'NEW';
    const kitchen = line.itemStatus && line.itemStatus !== 'NEW' && line.itemStatus !== 'CANCELLED';
    const sent = Number(line.sentQuantity) || 0;
    const waiterPendingOk = kitchen && nextQty >= sent;
    if (!isNew && !(access.canCancelOrder && kitchen) && !waiterPendingOk) return;
    if (order?.status !== 'OPEN' && order?.status !== 'BILLING') return;
    // Kitchen refuse confirm lives in OrderLines (in-app modal — window.confirm is flaky on POS tablets).
    if (nextQty < 1) { m.removeItemMutation.mutate(line.id); return; }
    m.updateItemMutation.mutate({ itemId: line.id, quantity: nextQty });
  };

  const handleRemoveItem = (itemIdOrLine) => {
    const line = itemIdOrLine && typeof itemIdOrLine === 'object'
      ? itemIdOrLine
      : (order?.items || []).find((row) => String(row.id) === String(itemIdOrLine));
    const itemId = line?.id ?? itemIdOrLine;
    if (itemId == null) return;
    m.removeItemMutation.mutate(itemId);
  };

  const ensureOrderId = async () => {
    if (activeOrderId) return activeOrderId;
    const table = draftTableRef.current;
    if (!table?.id) throw new Error('table required');
    if (openingRef.current || m.openMutation.isPending) throw new Error('open pending');
    if (!access.canOpenOrder) {
      toast.error(t('rst.floor.noOpenPermission'));
      throw new Error('no permission');
    }
    if (!ensureShift()) throw new Error('shift required');
    openingRef.current = true;
    try {
      const created = await m.openMutation.mutateAsync({
        table,
        guestCount: 1,
        childrenCount: 0,
      });
      clearDraft();
      return created.id;
    } finally {
      openingRef.current = false;
    }
  };

  const addToOrder = async (payload) => {
    try {
      const orderId = await ensureOrderId();
      m.addItemMutation.mutate({ ...payload, orderId });
    } catch {
      /* toast already shown */
    }
  };

  const addItemNow = (menuItem, extras = {}) => {
    if (!menuItem) return;
    if (activeOrderId) {
      if (order?.status !== 'OPEN' && order?.status !== 'BILLING') return;
      m.addItemMutation.mutate({
        menuItem,
        modifierOptionIds: extras.modifierOptionIds ?? [],
        note: extras.note ?? '',
        quantity: extras.quantity,
      });
      return;
    }
    if (!draftTableRef.current) return;
    addToOrder({
      menuItem,
      modifierOptionIds: extras.modifierOptionIds ?? [],
      note: extras.note ?? '',
      quantity: extras.quantity,
    });
  };

  const handleAddItem = (menuItem) => {
    if (!menuItem) return;
    if (!activeOrderId && !draftTableRef.current) return;
    if (isWeightSoldMenuItem(menuItem)) {
      setPendingWeightItem(menuItem);
      return;
    }
    addItemNow(menuItem);
  };

  const handleComposeFamily = (family) => {
    const item = family?.primary ?? family?.variants?.[0];
    handleAddItem(item);
  };

  const confirmWeightItem = ({ menuItem, quantity, note }) => {
    addItemNow(menuItem, { quantity, note });
  };

  const selectComposeVariant = (variant) => {
    if (!variant || variant.id === pendingMenuItem?.id) return;
    setPendingMenuItem(variant);
    setSelectedModifierIds([]);
  };

  const toggleModifier = (optionId) => {
    setSelectedModifierIds((current) => (
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    ));
  };

  const openLineNote = (line) => {
    setPendingMenuItem(null);
    setPendingVariants(null);
    setSelectedModifierIds([]);
    setPendingItemNote('');
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
    openTable, setOpenTable, reservedTable, setReservedTable, beginOpenTable, openExtraCheck,
    openExtraCheckPending: m.openExtraCheckMutation.isPending,
    guestForm, setGuestForm,
    activeOrderId, setActiveOrderId, order, orderPartial,
    menuItems: menuQuery.data ?? [],
    prefetchOrder,
    isLoading: (workspace.storeId == null && workspace.isLoading)
      || (onFloor ? floorQuery.isLoading : counterQuery.isLoading),
    isError: onFloor ? floorQuery.isError : counterQuery.isError,
    handleTableClick, handleAddItem, handleComposeFamily,
    openMutation: m.openMutation, addItemMutation: m.addItemMutation, handleQty,
    handleRemoveItem,
    removeItemMutation: m.removeItemMutation, cancelMutation: m.cancelMutation,
    sendKitchenMutation: m.sendKitchenMutation, billMutation: m.billMutation,
    discountMutation: m.discountMutation,
    payMutation: m.payMutation,
    paidReceipt, closePaidReceipt: () => setPaidReceipt(null),
    payModalOpen, openPayModal: () => setPayModalOpen(true),
    closePayModal: () => setPayModalOpen(false),
    refundMutation: m.refundMutation, pendingMenuItem, pendingVariants,
    pendingWeightItem,
    pendingItemNote, setPendingItemNote,
    modifierGroups: modifierQuery.data ?? [], selectedModifierIds, toggleModifier,
    selectComposeVariant,
    confirmModifiers: () => {
      if (!pendingMenuItem) return;
      addItemNow(pendingMenuItem, {
        modifierOptionIds: selectedModifierIds,
        note: pendingItemNote,
      });
    },
    confirmWeightItem,
    beginDraftTable,
    clearDraft,
    draftTable,
    isDraftOrder: Boolean(draftTable && !activeOrderId),
    orderForUi: activeOrderId ? order : draftOrderFromTable(draftTable),
    draftHallName: draftTable
      ? resolveOrderHallName(halls, { tableId: draftTable.id }, selectedHall?.name)
      : null,
    closeWeightPick: () => setPendingWeightItem(null),
    closeModifiers: () => {
      setPendingMenuItem(null);
      setPendingVariants(null);
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
    canRequestBill: access.canRequestBill && orderFlags.canRequestBill,
    canPay: access.canPay && orderFlags.canPay,
    canAdmin: access.canConfigureHall,
    backLabelKey,
    shift, shiftOpenLabel, floorSearch, setFloorSearch, waiters, waiterNameById,
    assignWaiterMutation: m.assignWaiterMutation,
    updateGuestsMutation: m.updateGuestsMutation, servicePreview,
    shiftModal, setShiftModal, openingCash, setOpeningCash, closingCash, setClosingCash,
    openShiftMutation: m.openShiftMutation, closeShiftMutation: m.closeShiftMutation,
    tableActions,
  };
}
