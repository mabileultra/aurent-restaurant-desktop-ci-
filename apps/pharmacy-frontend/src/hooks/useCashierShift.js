import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import {
  useConnectivityStore,
  useShouldUseOfflinePos,
} from '../store/connectivityStore';
import {
  posCloseShift,
  posFetchCurrentShift,
  posOpenShift,
  posXReport,
} from '../services/pos/posDataRouter';
import { resolvePosRoute } from '../services/pos/posRouteResolver';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

function shiftQueryKey(storeId, userId, catalogKind) {
  return ['cashier-shift', storeId, userId, catalogKind || 'grocery'];
}

/** Текущая открытая смена; null — смена не открыта. */
export async function fetchCurrentCashierShift(
  storeId,
  user,
  offlineShift = false,
  storeName = '',
  { catalogKind } = {},
) {
  return posFetchCurrentShift(storeId, user, storeName, { catalogKind });
}

export function useCashierShift(storeId, { catalogKind } = {}) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const offlineShift = useShouldUseOfflinePos();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: shiftQueryKey(storeId, userId, catalogKind),
    queryFn: () => posFetchCurrentShift(storeId, user, localStoreName || '', { catalogKind }),
    enabled: storeId != null && userId != null,
    retry: offlineShift ? false : 1,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    let prevRoute = resolvePosRoute(storeId, useConnectivityStore.getState()).route;
    const unsub = useConnectivityStore.subscribe((state) => {
      const nextRoute = resolvePosRoute(storeId, state).route;
      if (nextRoute !== prevRoute) {
        qc.invalidateQueries({ queryKey: shiftQueryKey(storeId, userId, catalogKind) });
        prevRoute = nextRoute;
      }
    });
    return unsub;
  }, [storeId, userId, catalogKind, qc]);

  return query;
}

export async function openCashierShift(storeId, user, offlineShift = false, storeName = '', { catalogKind } = {}) {
  return posOpenShift(storeId, user, storeName, { catalogKind });
}

export async function closeCashierShift(shiftId, storeId, user, shiftHint = null, { catalogKind } = {}) {
  return posCloseShift(shiftId, storeId, user, shiftHint, { catalogKind });
}

export function useOpenCashierShift(storeId, { catalogKind } = {}) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => posOpenShift(storeId, user, localStoreName || '', { catalogKind }),
    onSuccess: (data) => {
      qc.setQueryData(shiftQueryKey(storeId, userId, catalogKind), data);
    },
  });
}

export function useCloseCashierShift(storeId, { catalogKind } = {}) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, shift } = {}) =>
      posCloseShift(shiftId, storeId, user, shift || null, { catalogKind }),
    onSuccess: () => {
      qc.setQueryData(shiftQueryKey(storeId, userId, catalogKind), null);
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
    },
  });
}

export function useXReportCashierShift(storeId, { catalogKind } = {}) {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ shiftId, shift } = {}) =>
      posXReport(shiftId, storeId, user, shift || null, { catalogKind }),
  });
}

export { shiftQueryKey };
