import { useState } from 'react';
import { useFloorPosPage } from '../../hooks/useFloorPosPage';
import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { isCashierHallTab } from '../utils/cashierNav';
import { usePrefetchCashierSales } from './usePrefetchCashierSales';

/**
 * Cashier shell state on top of shared floor POS hook.
 */
export function useCashierPosPage() {
  const floor = useFloorPosPage();
  const [tab, setTabState] = useState('hall');
  const [selectedTableId, setSelectedTableId] = useState(null);

  usePrefetchCashierSales(
    floor.workspace.storeId,
    floor.access.canCounterSales && floor.workspace.storeId != null,
  );

  const setTab = (next) => {
    setTabState(next);

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

  const selectTable = (table) => {
    setSelectedTableId(table?.id ?? null);
    const orders = tableActiveOrders(table);
    if (orders.length > 1) {
      floor.handleTableClick(table);
      return;
    }
    const openOrderId = orders[0]?.id ?? table?.activeOrder?.id ?? table?.activeOrderId;
    if (openOrderId) {
      floor.setActiveOrderId(openOrderId);
      setTabState('hall');
      floor.setFloorSection('tables');
      if (floor.posMode !== 'floor') floor.changePosMode('floor');
      return;
    }
    floor.handleTableClick(table);
  };

  const clearOrder = () => {
    floor.setActiveOrderId(null);
    setSelectedTableId(null);
  };

  return {
    ...floor,
    tab,
    setTab,
    selectedTableId,
    setSelectedTableId,
    selectTable,
    clearOrder,
  };
}
