import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFloorPosPage } from '../../hooks/useFloorPosPage';
import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { tableStatusClass } from '../../utils/tableStatus';
import { isWeightSoldMenuItem } from '../../utils/menuWeightSale';
import { resolveOrderHallName } from '../../utils/floorPosDerivations';
import { isCashierHallTab } from '../utils/cashierNav';
import { usePrefetchCashierSales } from './usePrefetchCashierSales';

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

/**
 * Cashier shell state on top of shared floor POS hook.
 * Free table: select + menu first; order opens on the first dish.
 */
export function useCashierPosPage() {
  const floor = useFloorPosPage();
  const [tab, setTabState] = useState('hall');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [draftTable, setDraftTable] = useState(null);
  const [fullOrder, setFullOrder] = useState(false);
  const draftTableRef = useRef(null);
  const openingRef = useRef(false);

  usePrefetchCashierSales(
    floor.workspace.storeId,
    floor.access.canCounterSales && floor.workspace.storeId != null,
  );

  const clearDraft = () => {
    draftTableRef.current = null;
    setDraftTable(null);
  };

  const setTab = (next) => {
    setTabState(next);
    clearDraft();
    setFullOrder(false);

    if (next === 'sales') {
      if (floor.activeOrderId) floor.setActiveOrderId(null);
      if (floor.posMode !== 'takeaway' && floor.posMode !== 'delivery') {
        floor.changePosMode('takeaway');
      }
      return;
    }

    if (floor.posMode !== 'floor') {
      floor.changePosMode('floor');
    }

    if (next === 'bookings') {
      floor.setFloorSection('bookings');
    } else {
      floor.setFloorSection('tables');
    }

    if (!isCashierHallTab(next) && next !== 'orders' && next !== 'payment') {
      floor.setActiveOrderId(null);
      setSelectedTableId(null);
    }
  };

  const beginDraftTable = (table) => {
    if (!floor.access.canOpenOrder) {
      toast.error(floor.t('rst.floor.noOpenPermission'));
      return;
    }
    if (!floor.shift) {
      toast.error(floor.t('rst.shift.required'));
      floor.setShiftModal(true);
      return;
    }
    draftTableRef.current = table;
    setDraftTable(table);
    setSelectedTableId(table.id);
    floor.setActiveOrderId(null);
    setFullOrder(true);
    setTabState('hall');
    floor.setFloorSection('tables');
    if (floor.posMode !== 'floor') floor.changePosMode('floor');
  };

  const openTableOrder = (table, orderId) => {
    if (!orderId) return;
    clearDraft();
    setSelectedTableId(table?.id ?? null);
    floor.setActiveOrderId(orderId);
    setTabState('hall');
    floor.setFloorSection('tables');
    if (floor.posMode !== 'floor') floor.changePosMode('floor');
  };

  const selectTableCheck = (table, orderId) => {
    openTableOrder(table, orderId);
  };

  const selectTable = (table) => {
    setSelectedTableId(table?.id ?? null);
    const orders = tableActiveOrders(table);
    if (orders.length > 1) {
      // Multi-check table tile: open occupied modal (continue / new check). Checks open via selectTableCheck.
      clearDraft();
      setFullOrder(false);
      floor.handleTableClick(table);
      return;
    }
    const openOrderId = orders[0]?.id ?? table?.activeOrder?.id ?? table?.activeOrderId;
    if (openOrderId) {
      openTableOrder(table, openOrderId);
      return;
    }
    const status = tableStatusClass(table?.status);
    if (status === 'FREE' || status === 'CLEANING') {
      // CLEANING still goes through mark-ready on waiter; cashier treats as selectable draft after ready.
      if (status === 'CLEANING') {
        floor.handleTableClick(table);
        return;
      }
      beginDraftTable(table);
      return;
    }
    clearDraft();
    setFullOrder(false);
    floor.handleTableClick(table);
  };

  const clearOrder = () => {
    floor.setActiveOrderId(null);
    setSelectedTableId(null);
    clearDraft();
    setFullOrder(false);
  };

  const ensureOrderId = async () => {
    if (floor.activeOrderId) return floor.activeOrderId;
    const table = draftTableRef.current;
    if (!table?.id) {
      throw new Error('table required');
    }
    if (openingRef.current || floor.openMutation.isPending) {
      throw new Error('open pending');
    }
    if (!floor.access.canOpenOrder) {
      toast.error(floor.t('rst.floor.noOpenPermission'));
      throw new Error('no permission');
    }
    if (!floor.shift) {
      toast.error(floor.t('rst.shift.required'));
      floor.setShiftModal(true);
      throw new Error('shift required');
    }
    openingRef.current = true;
    try {
      const created = await floor.openMutation.mutateAsync({
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
      floor.addItemMutation.mutate({ ...payload, orderId });
    } catch {
      /* toast already shown */
    }
  };

  const handleAddItem = (menuItem) => {
    if (!menuItem) return;
    if (floor.activeOrderId) {
      floor.handleAddItem(menuItem);
      return;
    }
    if (!draftTableRef.current) return;
    if (isWeightSoldMenuItem(menuItem)) {
      floor.handleAddItem(menuItem);
      return;
    }
    addToOrder({ menuItem, modifierOptionIds: [], note: '' });
  };

  const handleComposeFamily = (family) => {
    // Same size-pick path as floor POS (opens ModifierPickModal with variants).
    floor.handleComposeFamily(family);
  };

  const confirmWeightItem = async ({ menuItem, quantity, note }) => {
    if (floor.activeOrderId) {
      floor.confirmWeightItem({ menuItem, quantity, note });
      return;
    }
    if (!draftTableRef.current) return;
    await addToOrder({ menuItem, quantity, note, modifierOptionIds: [] });
  };

  const confirmModifiers = async () => {
    if (!floor.pendingMenuItem) return;
    if (floor.activeOrderId) {
      floor.confirmModifiers();
      return;
    }
    if (!draftTableRef.current) return;
    await addToOrder({
      menuItem: floor.pendingMenuItem,
      modifierOptionIds: floor.selectedModifierIds,
      note: floor.pendingItemNote,
    });
  };

  const draftHallName = draftTable
    ? resolveOrderHallName(floor.halls, { tableId: draftTable.id }, floor.selectedHall?.name)
    : null;

  const orderForUi = floor.activeOrderId
    ? floor.order
    : draftOrderFromTable(draftTable);

  return {
    ...floor,
    tab,
    setTab,
    selectedTableId,
    setSelectedTableId,
    selectTable,
    selectTableCheck,
    clearOrder,
    draftTable,
    fullOrder,
    setFullOrder,
    orderForUi,
    draftHallName,
    handleAddItem,
    handleComposeFamily,
    confirmWeightItem,
    confirmModifiers,
    showFullOrder: Boolean(fullOrder && orderForUi),
    isDraftOrder: Boolean(draftTable && !floor.activeOrderId),
  };
}
