import {
  isDesktopOfflineBridge,
  offlineGetStatus,
  subscribeOfflineConnectivity,
} from '../services/offline/desktopOfflineBridge';
import { hasLocalPosCatalog as hasLocalPosCatalogRule } from '../services/offline/connectivityRules';
import { useAuthStore } from './authStore';
import { userHasCashierOfflineAccess } from '../utils/cashierOfflineAccess';
import { resolvePosRoute } from '../services/pos/posRouteResolver';
import { resetConnectivityStabilizer } from './connectivityStabilizer';
import { CONNECTIVITY_POLL_MS, useConnectivityStore } from './connectivityStoreCore';

export { resetConnectivityStabilizer };

let refreshTimer;
let unsubscribeConnectivity;
let browserConnectivityBound;

export function hasLocalPosCatalog(state = useConnectivityStore.getState(), storeId = null) {
  return hasLocalPosCatalogRule(state, storeId);
}

export function markApiUnreachable() {
  useConnectivityStore.getState().applyStatus({ apiOnline: false });
}

/** Использовать после успешного запроса к API (bootstrap/sync), если probe ещё не обновился. */
export function markApiReachable() {
  useConnectivityStore.getState().applyStatus({ apiOnline: true });
}

export async function refreshConnectivityStatus() {
  try {
    const status = await offlineGetStatus();
    useConnectivityStore.getState().applyStatus(status);
    return status;
  } catch {
    if (typeof window !== 'undefined' && window.desktopCashier?.isDesktop) {
      useConnectivityStore.getState().applyStatus({ apiOnline: false });
    }
    return null;
  }
}

function onBrowserOnline() {
  refreshConnectivityStatus();
}

function onWindowFocusRefreshConnectivity() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  refreshConnectivityStatus();
}

export function startConnectivityWatcher() {
  if (refreshTimer) return;
  refreshConnectivityStatus();
  refreshTimer = setInterval(refreshConnectivityStatus, CONNECTIVITY_POLL_MS);
  unsubscribeConnectivity = subscribeOfflineConnectivity((payload) => {
    useConnectivityStore.getState().applyStatus(payload);
  });
  if (!browserConnectivityBound && typeof window !== 'undefined') {
    browserConnectivityBound = true;
    window.addEventListener('online', onBrowserOnline);
    window.addEventListener('offline', () => {
      refreshConnectivityStatus();
    });
    window.addEventListener('focus', onWindowFocusRefreshConnectivity);
    document.addEventListener('visibilitychange', onWindowFocusRefreshConnectivity);
  }
}

export function stopConnectivityWatcher() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (unsubscribeConnectivity) {
    unsubscribeConnectivity();
    unsubscribeConnectivity = null;
  }
}

export function useShouldUseOfflinePos() {
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const forceOfflineMode = useConnectivityStore((s) => s.forceOfflineMode);
  const user = useAuthStore((s) => s.user);
  if (!isDesktopOfflineBridge()) return false;
  const offlineLike = forceOfflineMode || offlineMode || !apiOnline;
  if (!offlineLike) return false;
  // Until auth hydrates, still skip online POS fetches (avoids aurent.uz spam / black screen).
  if (!user) return true;
  return userHasCashierOfflineAccess(user);
}

function samePosRoute(a, b) {
  return (
    a.route === b.route
    && a.offlineLike === b.offlineLike
    && a.hasCatalog === b.hasCatalog
    && a.canFallback === b.canFallback
    && a.forceOffline === b.forceOffline
  );
}

export function usePosRoute(storeId) {
  return useConnectivityStore(
    (s) => resolvePosRoute(storeId, s),
    samePosRoute,
  );
}

export { isConnectivityOfflineLike, useConnectivityStore } from './connectivityStoreCore';
