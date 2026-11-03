import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useStoreFloorSync } from '../../pos/hooks/useStoreFloorSync';
import { groupReadyDisplayOrders } from '../utils/groupReadyDisplayOrders';
import { subscribeKitchenTvBump } from '../kitchenTvSyncChannel';
import { useReadyDisplayFreshKeys } from './useReadyDisplayFreshKeys';

export function useReadyDisplayBoard() {
  const workspace = useRestaurantWorkspaceStore();
  const qc = useQueryClient();

  useStoreFloorSync(workspace.storeId, { syncKitchen: true, pollInBackground: true });

  const kitchenBoardQuery = useQuery({
    queryKey: ['rst-kitchen-board', workspace.storeId],
    queryFn: () => rstKitchenApi.getKitchenBoard(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
    staleTime: 15_000,
  });
  const kitchenBoardEnabled = kitchenBoardQuery.isError || kitchenBoardQuery.data?.enabled !== false;

  const ticketsQuery = useQuery({
    queryKey: ['rst-kitchen-tickets', workspace.storeId, 'ready-display'],
    queryFn: () => rstKitchenApi.listTickets(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null && kitchenBoardEnabled,
    // Backup poll; primary updates come from kitchenTvSyncChannel (+ floor revision).
    staleTime: 0,
    refetchInterval: kitchenBoardEnabled ? 1_500 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (workspace.storeId == null) return undefined;
    return subscribeKitchenTvBump(workspace.storeId, () => {
      qc.invalidateQueries({
        queryKey: ['rst-kitchen-tickets', workspace.storeId, 'ready-display'],
      });
    });
  }, [workspace.storeId, qc]);

  const board = useMemo(
    () => groupReadyDisplayOrders(ticketsQuery.data ?? []),
    [ticketsQuery.data],
  );

  const { freshReadyKeys, freshCookingKeys } = useReadyDisplayFreshKeys(board, workspace.storeId);

  return {
    workspace,
    cooking: board.cooking,
    ready: board.ready,
    freshReadyKeys,
    freshCookingKeys,
    isLoading: (workspace.storeId == null && workspace.isLoading) || ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    kitchenBoardEnabled,
    kitchenBoardLoading: kitchenBoardQuery.isLoading,
    refetch: () => {
      ticketsQuery.refetch();
      kitchenBoardQuery.refetch();
    },
  };
}
