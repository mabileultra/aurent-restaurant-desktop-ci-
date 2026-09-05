import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCashierStore } from './useCashierStore';
import {
  refreshConnectivityStatus,
  startConnectivityWatcher,
  stopConnectivityWatcher,
  useConnectivityStore,
} from '../store/connectivityStore';
import {
  CATALOG_STALE_CHECK_MS,
  SALES_SYNC_INTERVAL_MS,
  isCatalogStoreMismatch,
  runCatalogSyncIfNeeded,
  runSalesSyncOnly,
} from '../services/offline/offlineSyncService';
import { offlineGetStatus } from '../services/offline/desktopOfflineBridge';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

export function useOfflineConnectivity() {
  const token = useAuthStore((s) => s.token);
  const { storeId } = useCashierStore();
  const prevStoreIdRef = useRef(storeId);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const syncing = useConnectivityStore((s) => s.syncing);
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);

  useEffect(() => {
    if (!isDesktopOfflineBridge()) return undefined;
    startConnectivityWatcher();
    return () => stopConnectivityWatcher();
  }, []);

  useEffect(() => {
    const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    if (!isDesktopOfflineBridge() || !token || !storeId || (!apiOnline && !browserOnline)) return undefined;

    let cancelled = false;

    const storeChanged = prevStoreIdRef.current !== storeId;
    prevStoreIdRef.current = storeId;

    const runInitialSync = async () => {
      useConnectivityStore.getState().setSyncing(true);
      useConnectivityStore.getState().setSyncingCatalog(true);
      try {
        let forceCatalog = storeChanged;
        if (!forceCatalog) {
          try {
            const status = await offlineGetStatus();
            forceCatalog =
              isCatalogStoreMismatch(status.storeId, storeId)
              || !(status.bootstrapReady || status.canSellOffline || Number(status.productCount) > 0);
          } catch {
            forceCatalog = true;
          }
        }
        const catalogResult = await runCatalogSyncIfNeeded(storeId, { force: forceCatalog });
        await runSalesSyncOnly();
        if (!cancelled) {
          if (catalogResult?.skipped && catalogResult?.reason === 'error') {
            useConnectivityStore.getState().setSyncResult({
              ok: false,
              error: catalogResult.error || 'catalog_sync_failed',
            });
          } else {
            useConnectivityStore.getState().setSyncResult({ ok: true });
          }
          await refreshConnectivityStatus();
        }
      } catch (err) {
        if (!cancelled) {
          useConnectivityStore.getState().setSyncResult({
            ok: false,
            error: err?.message || String(err),
          });
        }
      } finally {
        useConnectivityStore.getState().setSyncingCatalog(false);
      }
    };

    runInitialSync();

    const salesTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        await runSalesSyncOnly();
        await refreshConnectivityStatus();
      } catch {
        /* retry next tick */
      }
    }, SALES_SYNC_INTERVAL_MS);

    const catalogTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await runCatalogSyncIfNeeded(storeId, { force: false });
        if (result?.skipped && result?.reason === 'error') {
          useConnectivityStore.getState().setSyncResult({
            ok: false,
            error: result.error || 'catalog_sync_failed',
          });
          return;
        }
        if (!result?.skipped) {
          useConnectivityStore.getState().setSyncResult({ ok: true });
          await refreshConnectivityStatus();
        }
      } catch {
        /* retry on next check */
      }
    }, CATALOG_STALE_CHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(salesTimer);
      clearInterval(catalogTimer);
    };
  }, [token, storeId, apiOnline]);

  return {
    apiOnline,
    offlineMode,
    pendingSales,
    syncing,
    canSellOffline,
    bootstrapReady,
  };
}
