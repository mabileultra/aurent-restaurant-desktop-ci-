import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { useStoreFloorSync } from '../../pos/hooks/useStoreFloorSync';
import { playPosSound } from '../../pos/utils/posSounds';
import { groupReadyDisplayOrders } from '../utils/groupReadyDisplayOrders';

const FRESH_MS = 12_000;

export function useReadyDisplayBoard() {
  const workspace = useRestaurantWorkspaceStore();
  const seenReadyKeysRef = useRef(null);
  const [freshKeys, setFreshKeys] = useState(() => new Set());

  useStoreFloorSync(workspace.storeId, { syncKitchen: true });

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
    refetchInterval: kitchenBoardEnabled ? 5_000 : false,
  });

  const board = useMemo(
    () => groupReadyDisplayOrders(ticketsQuery.data ?? []),
    [ticketsQuery.data],
  );

  useEffect(() => {
    const readyKeys = board.ready.map((row) => row.key);
    if (seenReadyKeysRef.current == null) {
      seenReadyKeysRef.current = new Set(readyKeys);
      return undefined;
    }

    const arrived = [];
    for (const key of readyKeys) {
      if (!seenReadyKeysRef.current.has(key)) {
        seenReadyKeysRef.current.add(key);
        arrived.push(key);
      }
    }

    const cookingKeys = new Set(board.cooking.map((row) => row.key));
    for (const key of [...seenReadyKeysRef.current]) {
      if (!readyKeys.includes(key) && !cookingKeys.has(key)) {
        seenReadyKeysRef.current.delete(key);
      }
    }

    if (!arrived.length) return undefined;

    playPosSound('ready');
    setFreshKeys((prev) => {
      const next = new Set(prev);
      for (const key of arrived) next.add(key);
      return next;
    });

    const timer = window.setTimeout(() => {
      setFreshKeys((prev) => {
        const next = new Set(prev);
        for (const key of arrived) next.delete(key);
        return next;
      });
    }, FRESH_MS);

    return () => window.clearTimeout(timer);
  }, [board]);

  useEffect(() => {
    seenReadyKeysRef.current = null;
    setFreshKeys(new Set());
  }, [workspace.storeId]);

  return {
    workspace,
    cooking: board.cooking,
    ready: board.ready,
    freshKeys,
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
