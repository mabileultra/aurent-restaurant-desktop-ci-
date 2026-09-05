import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useAuthStore } from '../../../store/authStore';
import { userHasCashierOfflineAccess } from '../../../utils/cashierOfflineAccess';
import { isDesktopCashier } from '../../../utils/authLogin';
import {
  useConnectivityStore,
  usePosRoute,
  refreshConnectivityStatus,
} from '../../../store/connectivityStore';
import {
  pushPendingSales,
  refreshCatalogBootstrap,
} from '../../../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';

function formatCatalogSyncAt(iso) {
  if (!iso) return null;
  try {
    return format(new Date(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return iso;
  }
}

function invalidatePosData(qc, storeId) {
  qc.invalidateQueries({ queryKey: ['pos-categories'] });
  qc.invalidateQueries({ queryKey: ['pos-products'] });
  if (storeId) {
    qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
  }
}

export function useOfflineStatus() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const forceOfflineMode = useConnectivityStore((s) => s.forceOfflineMode);
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const syncing = useConnectivityStore((s) => s.syncing);
  const syncingCatalog = useConnectivityStore((s) => s.syncingCatalog);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  const lastCatalogSyncAt = useConnectivityStore((s) => s.lastCatalogSyncAt);
  const productCount = useConnectivityStore((s) => s.productCount);
  const lastSyncError = useConnectivityStore((s) => s.lastSyncError);
  const user = useAuthStore((s) => s.user);
  const offlineAllowed = userHasCashierOfflineAccess(user);
  const posRoute = usePosRoute(storeId);

  const visible = isDesktopOfflineBridge();
  const desktopShell = isDesktopCashier();
  const notAllowed = !offlineAllowed && (offlineMode || forceOfflineMode);
  const networkOffline = offlineMode || !apiOnline;
  const showOffline = forceOfflineMode || networkOffline || posRoute.route === 'local';
  const showPending = apiOnline && pendingSales > 0;
  const catalogLabel = formatCatalogSyncAt(lastCatalogSyncAt);
  const showCatalogStrip = !showOffline && apiOnline && bootstrapReady;
  const catalogBusy = Boolean(syncingCatalog || (syncing && !bootstrapReady && visible));
  // Клик всегда: выключить офлайн можно без bridge; включить — handler проверит bridge.
  const canToggle = Boolean(forceOfflineMode || offlineAllowed);

  const handleToggleForceOffline = useCallback(async (enabled) => {
    const toastId = 'pos-force-offline';

    if (!enabled) {
      useConnectivityStore.getState().setForceOfflineMode(false);
      invalidatePosData(qc, storeId);
      toast.success(t('offline.forceOfflineOff'), { id: toastId });
      return;
    }

    if (!isDesktopOfflineBridge()) {
      toast.error(t('offline.desktopBridgeRequired'), { id: toastId, duration: 6000 });
      try {
        if (typeof window.desktopCashier?.checkForUpdates === 'function') {
          await window.desktopCashier.checkForUpdates();
        }
      } catch {
        /* ignore */
      }
      return;
    }

    if (!storeId) {
      toast.error(t('offline.noCatalog'), { id: toastId });
      return;
    }

    let ready = Boolean(canSellOffline || posRoute.hasCatalog);

    if (!ready) {
      const browserOnline =
        typeof navigator === 'undefined' || navigator.onLine !== false;

      if (!browserOnline) {
        toast.error(t('offline.noCatalog'), { id: toastId });
        return;
      }

      useConnectivityStore.getState().setSyncingCatalog(true);
      toast.loading(t('offline.preparingCatalogForOffline'), { id: toastId });
      try {
        const result = await refreshCatalogBootstrap(storeId, { force: true });
        if (result?.skipped && result?.reason === 'error') {
          throw new Error(t('offline.updateCatalogFailed'));
        }
        await refreshConnectivityStatus();
        const st = useConnectivityStore.getState();
        ready =
          Boolean(st.canSellOffline)
          || Boolean(st.bootstrapReady)
          || Number(st.productCount) > 0;
        if (
          ready
          && st.storeId != null
          && storeId != null
          && Number(st.storeId) !== Number(storeId)
        ) {
          ready = false;
        }
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || t('offline.updateCatalogFailed');
        toast.error(message, { id: toastId });
        return;
      } finally {
        useConnectivityStore.getState().setSyncingCatalog(false);
      }
    }

    if (!ready) {
      toast.error(t('offline.noCatalog'), { id: toastId });
      return;
    }

    useConnectivityStore.getState().setForceOfflineMode(true);
    invalidatePosData(qc, storeId);
    toast.success(t('offline.forceOfflineOn'), { id: toastId });
  }, [canSellOffline, posRoute.hasCatalog, qc, storeId, t]);

  const handleSyncSales = useCallback(async () => {
    useConnectivityStore.getState().setSyncing(true);
    try {
      await pushPendingSales();
      useConnectivityStore.getState().setSyncResult({ ok: true });
      await refreshConnectivityStatus();
    } catch (err) {
      useConnectivityStore.getState().setSyncResult({
        ok: false,
        error: err?.message || String(err),
      });
    }
  }, []);

  const handleRefreshCatalog = useCallback(async () => {
    if (!storeId) return;
    if (forceOfflineMode || networkOffline) {
      toast.error(t('offline.updateCatalogNeedsInternet'));
      return;
    }
    useConnectivityStore.getState().setSyncingCatalog(true);
    try {
      const result = await refreshCatalogBootstrap(storeId, { force: true });
      if (result?.skipped && result?.reason === 'error') {
        throw new Error(t('offline.updateCatalogFailed'));
      }
      useConnectivityStore.getState().setSyncResult({ ok: true });
      await refreshConnectivityStatus();
      invalidatePosData(qc, storeId);
      if (!result?.skipped) {
        toast.success(t('offline.catalogUpdated', { count: result?.productCount ?? 0 }));
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || t('offline.updateCatalogFailed');
      useConnectivityStore.getState().setSyncResult({
        ok: false,
        error: message,
      });
      toast.error(message);
    } finally {
      useConnectivityStore.getState().setSyncingCatalog(false);
    }
  }, [forceOfflineMode, networkOffline, qc, storeId, t]);

  let message = t('offline.onlineOk');
  let shortLabel = t('offline.topbarOnline');
  let tone = 'ok';

  if (notAllowed) {
    message = t('offline.notAllowed');
    shortLabel = t('offline.topbarDenied');
    tone = 'warn';
  } else if (desktopShell && !visible) {
    message = t('offline.desktopBridgeRequired');
    shortLabel = t('offline.topbarDenied');
    tone = 'warn';
  } else if (forceOfflineMode && !posRoute.hasCatalog) {
    message = t('offline.forceOfflineNoCatalog');
    shortLabel = t('offline.topbarNoCatalog');
    tone = 'warn';
  } else if (showOffline && !canSellOffline && !posRoute.hasCatalog) {
    message = t('offline.noCatalog');
    shortLabel = t('offline.topbarNoCatalog');
    tone = 'warn';
  } else if (forceOfflineMode) {
    message = t('offline.forceOfflineActive');
    shortLabel = t('offline.topbarOffline');
    tone = 'offline';
  } else if (showOffline) {
    message = t('offline.workingOffline');
    shortLabel = t('offline.topbarOffline');
    tone = 'offline';
  } else if (showPending) {
    message = t('offline.pendingSales', { count: pendingSales });
    shortLabel = t('offline.topbarPending', { count: pendingSales });
    tone = 'pending';
  } else if (catalogBusy) {
    message = t('offline.preparingCatalog');
    shortLabel = t('offline.topbarSyncing');
    tone = 'pending';
  } else if (visible && !bootstrapReady && apiOnline && lastSyncError) {
    message = t('offline.updateCatalogFailed');
    shortLabel = t('offline.topbarNoCatalog');
    tone = 'warn';
  } else if (visible && !bootstrapReady && apiOnline) {
    message = t('offline.catalogNotReady');
    shortLabel = t('offline.topbarNoCatalog');
    tone = 'warn';
  } else if (showCatalogStrip && catalogLabel) {
    message = t('offline.catalogFresh', {
      date: catalogLabel,
      count: productCount,
    });
    shortLabel = t('offline.topbarOnline');
    tone = 'ok';
  }

  return {
    visible,
    notAllowed,
    message,
    shortLabel,
    tone,
    showOffline,
    showPending,
    offlineAllowed,
    forceOfflineMode,
    canSellOffline,
    apiOnline,
    networkOffline,
    syncing,
    syncingCatalog,
    canToggle,
    hasOfflineBridge: visible,
    actions: {
      // Desktop: allow force-offline even before canSellOffline is true; handler toasts if no catalog.
      showSwitchOffline: offlineAllowed && !forceOfflineMode && (canSellOffline || visible || desktopShell),
      showSwitchOnline: offlineAllowed && forceOfflineMode,
      showSyncSales: showPending && apiOnline,
      showRefreshCatalog: apiOnline && !forceOfflineMode && !networkOffline,
    },
    handlers: {
      toggleForceOffline: handleToggleForceOffline,
      syncSales: handleSyncSales,
      refreshCatalog: handleRefreshCatalog,
    },
  };
}
