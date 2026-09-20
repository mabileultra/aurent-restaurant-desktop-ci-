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
import { canRunOnlineSync } from '../services/offline/canRunOnlineSync';
import { runDesktopReconnectSync } from '../services/offline/runDesktopReconnectSync';
import { syncAuthSession } from '../utils/syncAuthSession';
import toast from 'react-hot-toast';
import i18n from '../i18n/config';

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

    const onReconnect = async () => {
      if (cancelled || !canRunOnlineSync()) return;
      const toastId = 'pos-reconnect-sync';
      toast.loading(i18n.t('offline.reconnectStarted'), { id: toastId });
      const result = await runDesktopReconnectSync(storeId, { catalogKind });
      if (cancelled) return;
      if (result?.skipped) {
        toast.dismiss(toastId);
        return;
      }
      if (result?.error || result?.catalog?.reason === 'error' || result?.sales?.error) {
        toast.error(i18n.t('offline.phaseError'), { id: toastId });
      } else {
        const pushed = Number(result?.sales?.pushed || 0);
        toast.success(
          pushed > 0
            ? i18n.t('offline.pendingSales', { count: pushed })
            : i18n.t('offline.phaseDone'),
          { id: toastId },
        );
      }
      await syncAuthSession();
    };

    runInitialSync();

    let reconnectTimer = null;
    const unsub = useConnectivityStore.subscribe((state, prev) => {
      if (cancelled) return;
      if (state.apiOnline && !prev?.apiOnline) {
        // Не стартовать sync на каждый короткий «online» — ждём стабильности.
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          if (cancelled || !canRunOnlineSync()) return;
          void onReconnect();
        }, 2_500);
      }
      if (!state.apiOnline && prev?.apiOnline && reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
        toast.dismiss('pos-reconnect-sync');
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
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      unsub();
      clearInterval(salesTimer);
      clearInterval(catalogTimer);
    };
  }, [token, storeId, catalogKind]);
}
