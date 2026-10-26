import { useState } from 'react';
import toast from 'react-hot-toast';
import { useFloorPosPage } from '../../hooks/useFloorPosPage';
import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { tableStatusClass } from '../../utils/tableStatus';
import { isCashierHallTab } from '../utils/cashierNav';
import { usePrefetchCashierSales } from './usePrefetchCashierSales';
import { useModuleAccess } from '../../../../hooks/useModuleAccess';

/**
 * Cashier shell state on top of shared floor POS hook.
 * Free table: select + menu first; order opens on the first dish.
 *
 * Draft table must live in useFloorPosPage (not a parallel ref here): MenuPicker
 * calls handleComposeFamily → floor gates on floor.draftTableRef.
 */
export function useCashierPosPage() {
  const floor = useFloorPosPage();
  const { hasModule } = useModuleAccess();
  const [tab, setTabState] = useState('hall');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [fullOrder, setFullOrder] = useState(false);

  usePrefetchCashierSales(
    floor.workspace.storeId,
    floor.access.canCounterSales && floor.workspace.storeId != null,
  );

  const clearDraft = () => {
    floor.clearDraft();
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
    // changePosMode clears draft — switch mode before starting draft.
    if (floor.posMode !== 'floor') floor.changePosMode('floor');
    floor.setFloorSection('tables');
    if (!floor.beginDraftTable(table)) return;
    setSelectedTableId(table.id);
    setFullOrder(true);
    setTabState('hall');
  };

  const openTableOrder = (table, orderId) => {
    if (!orderId) return;
    clearDraft();
    setSelectedTableId(table?.id ?? null);
    floor.setActiveOrderId(orderId);
    setTabState('hall');
    floor.setFloorSection('tables');
    if (floor.posMode !== 'floor') floor.changePosMode('floor');
    setFullOrder(true);
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

  const onQuickSaleOpened = (created) => {
    clearDraft();
    if (floor.posMode !== 'takeaway') floor.changePosMode('takeaway');
    floor.setActiveOrderId(created?.id ?? null);
    setSelectedTableId(null);
    setTabState('hall');
    setFullOrder(true);
  };

  const clearOrder = () => {
    floor.setActiveOrderId(null);
    setSelectedTableId(null);
    clearDraft();
    setFullOrder(false);
  };

  const handleAddItem = (menuItem) => {
    if (!menuItem) return;
    if (!floor.activeOrderId && !floor.draftTable) {
      toast.error(floor.t('rst.cashier.selectTableFirst', {
        defaultValue: 'Сначала выберите стол',
      }));
      return;
    }
    // Floor draft + compose/add share the same draftTableRef (set by beginDraftTable).
    floor.handleAddItem(menuItem);
  };

  const handleComposeFamily = (family) => {
    if (!family) return;
    if (!floor.activeOrderId && !floor.draftTable) {
      toast.error(floor.t('rst.cashier.selectTableFirst', {
        defaultValue: 'Сначала выберите стол',
      }));
      return;
    }
    floor.handleComposeFamily(family);
  };

  const confirmWeightItem = async ({ menuItem, quantity, note }) => {
    if (floor.activeOrderId || floor.draftTable) {
      floor.confirmWeightItem({ menuItem, quantity, note });
    }
  };

  const confirmModifiers = async () => {
    if (!floor.pendingMenuItem) return;
    if (floor.activeOrderId || floor.draftTable) {
      floor.confirmModifiers();
    }
  };

  return {
    ...floor,
    tab,
    setTab,
    selectedTableId,
    setSelectedTableId,
    selectTable,
    selectTableCheck,
    clearOrder,
    draftTable: floor.draftTable,
    fullOrder,
    setFullOrder,
    orderForUi: floor.orderForUi,
    draftHallName: floor.draftHallName,
    handleAddItem,
    handleComposeFamily,
    confirmWeightItem,
    confirmModifiers,
    showFullOrder: Boolean(fullOrder && floor.orderForUi),
    isDraftOrder: floor.isDraftOrder,
    quickSaleEnabled: hasModule('restaurantQuickSale'),
    onQuickSaleOpened,
  };
}
