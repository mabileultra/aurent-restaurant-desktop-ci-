import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCashierStore } from './useCashierStore';
import { useCashierStoreProfile } from './useCashierStoreProfile';
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
import { offlineGetStatus, isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

function canRunOnlineSync() {
  const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  const apiOnline = useConnectivityStore.getState().apiOnline;
  return Boolean(apiOnline || browserOnline);
}

export function useOfflineConnectivity() {
  const token = useAuthStore((s) => s.token);
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const catalogKind = isPharmacy ? 'pharmacy' : 'grocery';
  const prevStoreIdRef = useRef(storeId);

  useEffect(() => {
    if (!isDesktopOfflineBridge()) return undefined;
    startConnectivityWatcher();
    return () => stopConnectivityWatcher();
  }, []);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !token || !storeId) return undefined;

    let cancelled = false;
    const storeChanged = prevStoreIdRef.current !== storeId;
    prevStoreIdRef.current = storeId;

    const runCatalogSync = async (forceCatalog) => {
      if (cancelled || !canRunOnlineSync()) return;
      if (forceCatalog) {
        useConnectivityStore.getState().setSyncing(true);
        useConnectivityStore.getState().setSyncingCatalog(true);
      }
      try {
        const catalogResult = await runCatalogSyncIfNeeded(storeId, {
          force: forceCatalog,
          catalogKind,
        });
        if (cancelled) return;
        if (catalogResult?.skipped && catalogResult?.reason === 'error') {
          useConnectivityStore.getState().setSyncResult({
            ok: false,
            error: catalogResult.error || 'catalog_sync_failed',
          });
          return;
        }
        if (!catalogResult?.skipped) {
          useConnectivityStore.getState().setSyncResult({ ok: true });
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
        if (forceCatalog) {
          useConnectivityStore.getState().setSyncingCatalog(false);
        }
      }
    };

    const runInitialSync = async () => {
      if (!canRunOnlineSync()) return;
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
      await runCatalogSync(forceCatalog);
      if (!cancelled) {
        await runSalesSyncOnly({ catalogKind });
      }
    };

    runInitialSync();

    const unsub = useConnectivityStore.subscribe((state, prev) => {
      if (cancelled) return;
      if (state.apiOnline && !prev?.apiOnline) {
        runCatalogSync(false);
      }
    });

    const salesTimer = setInterval(async () => {
      if (cancelled || !canRunOnlineSync()) return;
      try {
        await runSalesSyncOnly({ catalogKind });
        await refreshConnectivityStatus();
      } catch {
        /* retry next tick */
      }
    }, SALES_SYNC_INTERVAL_MS);

    const catalogTimer = setInterval(() => {
      runCatalogSync(false);
    }, CATALOG_STALE_CHECK_MS);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(salesTimer);
      clearInterval(catalogTimer);
    };
  }, [token, storeId, catalogKind]);
}
