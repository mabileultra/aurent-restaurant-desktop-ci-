import { create } from 'zustand';
import { isConnectivityOfflineLike as isConnectivityOfflineLikeRule } from '../services/offline/connectivityRules';
import { readForceOfflineMode, writeForceOfflineMode } from '../services/pos/posForceOfflineStorage';
import { isOfflineFirstDesktop } from '../services/offline/offlineFirstFlag';
import { logConnectivity, logError } from '../services/desktop/activityLog';
import { stabilizeApiOnline } from './connectivityStabilizer';

export const CONNECTIVITY_POLL_MS = 5_000;

export function connectivityFields(state) {
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

export function connectivityFieldsEqual(a, b) {
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
