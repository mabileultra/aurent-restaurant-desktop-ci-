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
import { isOfflineFirstDesktop } from '../services/offline/offlineFirstFlag';
import { logConnectivity, logError } from '../services/desktop/activityLog';

/** Online — после трёх подряд успешных probe; offline — после двух сбоев. */
const ONLINE_RECOVERY_STREAK = 3;
/** Offline — после двух подряд неудачных probe (меньше мигания полоски). */
const OFFLINE_FAILURE_STREAK = 2;
const CONNECTIVITY_POLL_MS = 5_000;
/** После 502/таймаута API не переключаться обратно в online сразу (probe может мигать). */
const API_UNREACHABLE_COOLDOWN_MS = 20_000;
/** После ухода в offline не принимать «online» от browser event без серии probe. */
const OFFLINE_HOLD_MS = 8_000;
let stableApiOnline = null;
let onlineRecoveryStreak = 0;
let offlineFailureStreak = 0;
let apiUnreachableUntil = 0;
let offlineSinceMs = 0;

export function resetConnectivityStabilizer() {
  stableApiOnline = null;
  onlineRecoveryStreak = 0;
  offlineFailureStreak = 0;
  apiUnreachableUntil = 0;
  offlineSinceMs = 0;
}

function stabilizeApiOnline(rawOnline) {
  const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (browserOffline) {
    apiUnreachableUntil = Date.now() + API_UNREACHABLE_COOLDOWN_MS;
    stableApiOnline = false;
    onlineRecoveryStreak = 0;
    offlineFailureStreak = OFFLINE_FAILURE_STREAK;
    if (!offlineSinceMs) offlineSinceMs = Date.now();
    return false;
  }

  // Successful main-process probe clears cooldown so reconnect is not stuck.
  if (rawOnline) {
    if (offlineSinceMs && Date.now() - offlineSinceMs < OFFLINE_HOLD_MS) {
      // Короткий «online» сразу после обрыва — часто ложный (Wi‑Fi без интернета).
      onlineRecoveryStreak = 0;
      stableApiOnline = false;
      return false;
    }
    apiUnreachableUntil = 0;
  } else if (Date.now() < apiUnreachableUntil) {
    stableApiOnline = false;
    onlineRecoveryStreak = 0;
    offlineFailureStreak = 0;
    return false;
  }

  if (!rawOnline) {
    offlineFailureStreak += 1;
    if (stableApiOnline === false) {
      onlineRecoveryStreak = 0;
      if (!offlineSinceMs) offlineSinceMs = Date.now();
      return false;
    }
    if (offlineFailureStreak >= OFFLINE_FAILURE_STREAK) {
      stableApiOnline = false;
      onlineRecoveryStreak = 0;
      if (!offlineSinceMs) offlineSinceMs = Date.now();
      return false;
    }
    return true;
  }

  offlineFailureStreak = 0;
  if (stableApiOnline === null) {
    stableApiOnline = rawOnline;
    onlineRecoveryStreak = rawOnline ? 1 : 0;
    if (stableApiOnline) offlineSinceMs = 0;
    return stableApiOnline;
  }
  if (!stableApiOnline) {
    onlineRecoveryStreak += 1;
    if (onlineRecoveryStreak >= ONLINE_RECOVERY_STREAK) {
      stableApiOnline = true;
      offlineSinceMs = 0;
    }
    return stableApiOnline;
  }
  offlineSinceMs = 0;
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
  apiOnline: !isOfflineFirstDesktop(),
  offlineMode: isOfflineFirstDesktop(),
  forceOfflineMode: readForceOfflineMode(),
  canSellOffline: false,
  bootstrapReady: false,
  pendingSales: 0,
  syncing: false,
  syncingCatalog: false,
  syncPhase: 'idle',
  syncPhaseDetail: null,
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
    // Десктоп всегда шлёт offlineMode = !apiOnline с одного probe — не обходить
    // стабилизатор, иначе бейдж мигает каждые CONNECTIVITY_POLL_MS.
    const apiOnline = stabilizeApiOnline(rawApiOnline);
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
    if (prev.apiOnline !== next.apiOnline || prev.offlineMode !== next.offlineMode) {
      logConnectivity(
        next.apiOnline ? 'Связь с сервером восстановлена' : 'Нет связи с сервером — офлайн',
        {
          apiOnline: next.apiOnline,
          offlineMode: next.offlineMode,
          pendingSales: next.pendingSales,
          productCount: next.productCount,
        },
        next.apiOnline ? 'info' : 'warn',
      );
    }
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

  setSyncPhase(phase, detail = null) {
    const nextPhase = phase || 'idle';
    const nextDetail = detail == null ? null : String(detail);
    const prev = get();
    if (prev.syncPhase === nextPhase && prev.syncPhaseDetail === nextDetail) return;
    set({ syncPhase: nextPhase, syncPhaseDetail: nextDetail });
  },

  setSyncResult({ ok, error } = {}) {
    set({
      syncing: false,
      syncingCatalog: false,
      syncPhase: ok ? 'done' : 'error',
      syncPhaseDetail: error || null,
      lastSyncAt: ok ? new Date().toISOString() : get().lastSyncAt,
      lastSyncError: error || null,
    });
    if (!ok && error) {
      logError(`Синхронизация: ${error}`);
    }
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
  if (!offlineSinceMs) offlineSinceMs = Date.now();
  if (!state.apiOnline && state.offlineMode) return;
  useConnectivityStore.getState().applyStatus({ apiOnline: false, offlineMode: true });
}

/** Использовать после успешного запроса к API (bootstrap/sync), если probe ещё не обновился. */
export function markApiReachable() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  apiUnreachableUntil = 0;
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
    if (status?.apiOnline) {
      // Не сбрасываем cooldown здесь — stabilizeApiOnline сам решает после hold.
    }
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
  // macOS часто шлёт «online» при Wi‑Fi без интернета — только перепроверяем probe.
  offlineFailureStreak = 0;
  refreshConnectivityStatus();
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
    window.addEventListener('online', onBrowserOnline);
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
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const offlineLike = forceOfflineMode || offlineMode || !apiOnline || browserOffline;
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
