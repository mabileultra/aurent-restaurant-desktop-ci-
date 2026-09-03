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

function shiftQueryKey(storeId, userId) {
  return ['cashier-shift', storeId, userId];
}

/** Текущая открытая смена; null — смена не открыта. */
export async function fetchCurrentCashierShift(storeId, user, offlineShift = false, storeName = '') {
  return posFetchCurrentShift(storeId, user, storeName);
}

export function useCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const offlineShift = useShouldUseOfflinePos();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: shiftQueryKey(storeId, userId),
    queryFn: () => posFetchCurrentShift(storeId, user, localStoreName || ''),
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
        qc.invalidateQueries({ queryKey: shiftQueryKey(storeId, userId) });
        prevRoute = nextRoute;
      }
    });
    return unsub;
  }, [storeId, userId, qc]);

  return query;
}

export async function openCashierShift(storeId, user, offlineShift = false, storeName = '') {
  return posOpenShift(storeId, user, storeName);
}

export async function closeCashierShift(shiftId, storeId, user, shiftHint = null) {
  return posCloseShift(shiftId, storeId, user, shiftHint);
}

export function useOpenCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => posOpenShift(storeId, user, localStoreName || ''),
    onSuccess: (data) => {
      qc.setQueryData(shiftQueryKey(storeId, userId), data);
    },
  });
}

export function useCloseCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, shift } = {}) =>
      posCloseShift(shiftId, storeId, user, shift || null),
    onSuccess: () => {
      qc.setQueryData(shiftQueryKey(storeId, userId), null);
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
    },
  });
}

export function useXReportCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ shiftId, shift } = {}) =>
      posXReport(shiftId, storeId, user, shift || null),
  });
}

export { shiftQueryKey };
