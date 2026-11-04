import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../../api';
import { rstFloorApi } from '../../api/floor.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { rstOrderApi } from '../../api/order.api';
import { rstShiftApi } from '../../api/shift.api';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstForeignTableOrdersApi } from '../../api/foreignTableOrders.api';
import {
  buildWaiters,
  buildWaiterNameById,
  resolveOrderHallName,
} from '../utils/floorPosDerivations';
import { resolveServicePreview } from '../utils/restaurantPayAmount';
import { ALL_HALLS_ID, collectHallTables } from '../utils/floorStatusFilters';
import { orderPlaceholderFromFloor } from '../utils/orderFloorPlaceholder';
import { canWaiterMutateOrder } from '../utils/canWaiterMutateOrder';
import { resolveFloorOrderFlags } from '../utils/resolveFloorOrderFlags';
import {
  COUNTER_STALE_MS,
  FLOOR_STALE_MS,
  MENU_STALE_MS,
  ORDER_POLL_MS,
  ORDER_STALE_MS,
  SHIFT_STALE_MS,
} from '../utils/floorPosStale';

export function useFloorPosQueries({
  storeId,
  onFloor,
  channel,
  activeOrderId,
  selectedHallId,
  pendingMenuItemId,
  user,
}) {
  const qc = useQueryClient();

  const floorQuery = useQuery({
    queryKey: ['rst-floor', storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(storeId).then((r) => r.data),
    enabled: storeId != null && (onFloor || !!activeOrderId),
    staleTime: FLOOR_STALE_MS,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  const counterQuery = useQuery({
    queryKey: ['rst-counter-orders', storeId, channel],
    queryFn: () => rstOrderApi.listActive(storeId, channel).then((r) => r.data),
    enabled: storeId != null && !!channel && !activeOrderId,
    staleTime: COUNTER_STALE_MS,
    refetchInterval: 15_000,
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
    refetchInterval: 45_000,
  });

  const menuQuery = useQuery({
    queryKey: ['rst-menu-pos', storeId],
    queryFn: () => rstMenuApi.list(storeId, true).then((r) => r.data),
    enabled: storeId != null,
    staleTime: MENU_STALE_MS,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
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
    queryKey: ['rst-menu-modifiers', pendingMenuItemId],
    queryFn: () => rstModifierApi.listForMenuItem(pendingMenuItemId).then((r) => r.data),
    enabled: !!pendingMenuItemId,
  });

  const kitchenBoardQuery = useQuery({
    queryKey: ['rst-kitchen-board', storeId],
    queryFn: () => rstKitchenApi.getKitchenBoard(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 15_000,
  });

  const foreignTableQuery = useQuery({
    queryKey: ['rst-foreign-table-orders', storeId],
    queryFn: () => rstForeignTableOrdersApi.get(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 30_000,
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

  const allowForeignTableOrders = foreignTableQuery.data?.allowed !== false;
  const canMutateOrderLines = canWaiterMutateOrder({
    role: user?.role,
    userId: user?.id,
    orderWaiterUserId: order?.waiterUserId,
    allowForeignTableOrders,
  });
  const kitchenBoardEnabled = kitchenBoardQuery.data?.enabled !== false;
  const orderFlags = resolveFloorOrderFlags({
    order,
    kitchenBoardEnabled,
    orderPartial,
    canMutateOrderLines,
  });

  const prefetchOrder = (orderId) => {
    if (!orderId) return;
    qc.prefetchQuery({
      queryKey: ['rst-order', orderId],
      queryFn: () => rstOrderApi.get(orderId).then((r) => r.data),
      staleTime: ORDER_STALE_MS,
    });
  };

  return {
    qc,
    floorQuery,
    counterQuery,
    shiftQuery,
    menuQuery,
    orderQuery,
    modifierQuery,
    halls,
    selectedHall,
    hallTables,
    shift,
    order,
    orderPartial,
    orderHallName,
    waiters,
    waiterNameById,
    servicePreview,
    allowForeignTableOrders,
    canMutateOrderLines,
    orderFlags,
    prefetchOrder,
    menuItems: menuQuery.data ?? [],
    modifierGroups: modifierQuery.data ?? [],
    counterOrders: counterQuery.data ?? [],
  };
}
