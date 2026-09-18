import { create } from 'zustand';
import {
  isDesktopOfflineBridge,
  offlineGetStatus,
  subscribeOfflineConnectivity,
} from '../services/offline/desktopOfflineBridge';
import {
  hasLocalPosCatalog as hasLocalPosCatalogRule,
  isConnectivityOfflineLike as isConnectivityOfflineLikeRule,
} from '../services/offline/connectivityRules';
import { useAuthStore } from './authStore';
import { userHasCashierOfflineAccess } from '../utils/cashierOfflineAccess';
import {
  readForceOfflineMode,
  writeForceOfflineMode,
} from '../services/pos/posForceOfflineStorage';
import { resolvePosRoute } from '../services/pos/posRouteResolver';

/** Сразу offline при сбое probe; online — после двух подряд успешных probe. */
const ONLINE_RECOVERY_STREAK = 2;
/** Offline — после двух подряд неудачных probe (меньше мигания полоски). */
const OFFLINE_FAILURE_STREAK = 2;
const CONNECTIVITY_POLL_MS = 5_000;
/** После 502/таймаута API не переключаться обратно в online сразу (probe может мигать). */
const API_UNREACHABLE_COOLDOWN_MS = 12_000;
let stableApiOnline = null;
let onlineRecoveryStreak = 0;
let offlineFailureStreak = 0;
let apiUnreachableUntil = 0;

export function resetConnectivityStabilizer() {
  stableApiOnline = null;
  onlineRecoveryStreak = 0;
  offlineFailureStreak = 0;
  apiUnreachableUntil = 0;
}

function stabilizeApiOnline(rawOnline) {
  if (Date.now() < apiUnreachableUntil) {
    stableApiOnline = false;
    onlineRecoveryStreak = 0;
    offlineFailureStreak = 0;
    return false;
  }

  if (!rawOnline) {
    offlineFailureStreak += 1;
    if (stableApiOnline === null || stableApiOnline === false) {
      stableApiOnline = false;
      onlineRecoveryStreak = 0;
      return false;
    }
    if (offlineFailureStreak >= OFFLINE_FAILURE_STREAK) {
      stableApiOnline = false;
      onlineRecoveryStreak = 0;
      return false;
    }
    return true;
  }

  offlineFailureStreak = 0;
  if (stableApiOnline === null) {
    stableApiOnline = rawOnline;
    onlineRecoveryStreak = rawOnline ? 1 : 0;
    return stableApiOnline;
  }
  if (!stableApiOnline) {
    onlineRecoveryStreak += 1;
    if (onlineRecoveryStreak >= ONLINE_RECOVERY_STREAK) {
      stableApiOnline = true;
    }
    return stableApiOnline;
  }
  return true;
}

function connectivityFields(state) {
  return {
    apiOnline: state.apiOnline,
    offlineMode: state.offlineMode,
    canSellOffline: state.canSellOffline,
    bootstrapReady: state.bootstrapReady,
    pendingSales: state.pendingSales,
    lastCatalogSyncAt: state.lastCatalogSyncAt,
    productCount: state.productCount,
    storeId: state.storeId,
    storeName: state.storeName,
    deviceId: state.deviceId,
  };
}

function connectivityFieldsEqual(a, b) {
  return (
    a.apiOnline === b.apiOnline
    && a.offlineMode === b.offlineMode
    && a.canSellOffline === b.canSellOffline
    && a.bootstrapReady === b.bootstrapReady
    && a.pendingSales === b.pendingSales
    && a.lastCatalogSyncAt === b.lastCatalogSyncAt
    && a.productCount === b.productCount
    && a.storeId === b.storeId
    && a.storeName === b.storeName
    && a.deviceId === b.deviceId
  );
}

export function isConnectivityOfflineLike(state = useConnectivityStore.getState()) {
  return isConnectivityOfflineLikeRule(state);
}

export const useConnectivityStore = create((set, get) => ({
  apiOnline: true,
  offlineMode: false,
  forceOfflineMode: readForceOfflineMode(),
  canSellOffline: false,
  bootstrapReady: false,
  pendingSales: 0,
  syncing: false,
  syncingCatalog: false,
  lastSyncAt: null,
  lastCatalogSyncAt: null,
  productCount: 0,
  storeId: null,
  storeName: null,
  lastSyncError: null,
  deviceId: null,

  applyStatus(status) {
    if (!status) return;
    const prev = get();
    const rawApiOnline =
      status.apiOnline !== undefined ? Boolean(status.apiOnline) : prev.apiOnline;
    const rawOfflineMode =
      status.offlineMode !== undefined ? Boolean(status.offlineMode) : !rawApiOnline;
    const apiOnline = rawOfflineMode ? false : stabilizeApiOnline(rawApiOnline);
    const next = {
      apiOnline,
      offlineMode: !apiOnline,
      canSellOffline:
        status.canSellOffline !== undefined
          ? Boolean(status.canSellOffline)
          : prev.canSellOffline,
      bootstrapReady:
        status.bootstrapReady !== undefined
          ? Boolean(status.bootstrapReady)
          : prev.bootstrapReady,
      pendingSales:
        status.pendingSales !== undefined
          ? Number(status.pendingSales ?? 0)
          : prev.pendingSales,
      lastCatalogSyncAt:
        status.lastCatalogSyncAt !== undefined
          ? status.lastCatalogSyncAt || null
          : prev.lastCatalogSyncAt,
      productCount:
        status.productCount !== undefined
          ? Number(status.productCount ?? 0)
          : prev.productCount,
      storeId:
        status.storeId !== undefined
          ? status.storeId != null
            ? Number(status.storeId)
            : null
          : prev.storeId,
      storeName:
        status.storeName !== undefined ? status.storeName || null : prev.storeName,
      deviceId: status.deviceId !== undefined ? status.deviceId || null : prev.deviceId,
    };
    if (connectivityFieldsEqual(connectivityFields(prev), next)) return;
    set(next);
  },

  setSyncing(syncing) {
    const next = Boolean(syncing);
    if (get().syncing === next) return;
    set({ syncing: next });
  },

  setSyncingCatalog(syncingCatalog) {
    const next = Boolean(syncingCatalog);
    if (get().syncingCatalog === next) return;
    set({ syncingCatalog: next });
  },

  setSyncResult({ ok, error } = {}) {
    set({
      syncing: false,
      lastSyncAt: ok ? new Date().toISOString() : get().lastSyncAt,
      lastSyncError: error || null,
    });
  },

  setForceOfflineMode(enabled) {
    const next = Boolean(enabled);
    writeForceOfflineMode(next);
    set({ forceOfflineMode: next });
  },
}));

let refreshTimer;
let unsubscribeConnectivity;
let browserConnectivityBound;

export function hasLocalPosCatalog(state = useConnectivityStore.getState(), storeId = null) {
  return hasLocalPosCatalogRule(state, storeId);
}

export function markApiUnreachable() {
  const state = useConnectivityStore.getState();
  apiUnreachableUntil = Date.now() + API_UNREACHABLE_COOLDOWN_MS;
  stableApiOnline = false;
  onlineRecoveryStreak = 0;
  offlineFailureStreak = OFFLINE_FAILURE_STREAK;
  if (!state.apiOnline && state.offlineMode) return;
  useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
}

/** Использовать после успешного запроса к API (bootstrap/sync), если probe ещё не обновился. */
export function markApiReachable() {
  apiUnreachableUntil = 0;
  stableApiOnline = true;
  onlineRecoveryStreak = ONLINE_RECOVERY_STREAK;
  offlineFailureStreak = 0;
  useConnectivityStore.getState().applyStatus({ apiOnline: true, offlineMode: false });
}

function applyBrowserOfflineHint() {
  if (typeof navigator === 'undefined' || navigator.onLine) return;
  markApiUnreachable();
}

export async function refreshConnectivityStatus() {
  applyBrowserOfflineHint();
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

function onWindowFocusRefreshConnectivity() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  refreshConnectivityStatus();
}

export function startConnectivityWatcher() {
  if (refreshTimer) return;
  applyBrowserOfflineHint();
  refreshConnectivityStatus();
  refreshTimer = setInterval(refreshConnectivityStatus, CONNECTIVITY_POLL_MS);
  unsubscribeConnectivity = subscribeOfflineConnectivity((payload) => {
    useConnectivityStore.getState().applyStatus(payload);
  });
  if (!browserConnectivityBound && typeof window !== 'undefined') {
    browserConnectivityBound = true;
    window.addEventListener('online', () => refreshConnectivityStatus());
    window.addEventListener('offline', () => {
      applyBrowserOfflineHint();
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
  if (!userHasCashierOfflineAccess(user)) return false;
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return forceOfflineMode || offlineMode || !apiOnline || browserOffline;
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
