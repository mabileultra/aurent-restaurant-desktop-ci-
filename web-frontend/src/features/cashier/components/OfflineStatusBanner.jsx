import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useAuthStore } from '../../../store/authStore';
import { userHasCashierOfflineAccess } from '../../../utils/cashierOfflineAccess';
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

export default function OfflineStatusBanner() {
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
  const user = useAuthStore((s) => s.user);
  const offlineAllowed = userHasCashierOfflineAccess(user);
  const posRoute = usePosRoute(storeId);

  if (!isDesktopOfflineBridge()) return null;

  if (!offlineAllowed && (offlineMode || forceOfflineMode)) {
    return (
      <div className="offline-banner offline-banner--warn" role="status">
        <span className="offline-banner__icon">
          <CloudOff size={16} aria-hidden />
        </span>
        <span className="offline-banner__text">{t('offline.notAllowed')}</span>
      </div>
    );
  }

  const networkOffline = offlineMode || !apiOnline;
  const showOffline = forceOfflineMode || networkOffline || posRoute.route === 'local';
  const showPending = !forceOfflineMode && apiOnline && pendingSales > 0;
  const catalogLabel = formatCatalogSyncAt(lastCatalogSyncAt);
  const showCatalogStrip = !showOffline && apiOnline && bootstrapReady;

  const handleToggleForceOffline = (enabled) => {
    if (enabled && !canSellOffline && !posRoute.hasCatalog) {
      toast.error(t('offline.noCatalog'));
      return;
    }
    useConnectivityStore.getState().setForceOfflineMode(enabled);
    invalidatePosData(qc, storeId);
    toast.success(enabled ? t('offline.forceOfflineOn') : t('offline.forceOfflineOff'));
  };

  const handleSyncSales = async () => {
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
  };

  const handleRefreshCatalog = async () => {
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
  };

  let message = t('offline.onlineOk');
  let tone = 'offline-banner--ok';

  if (forceOfflineMode && !posRoute.hasCatalog) {
    message = t('offline.forceOfflineNoCatalog');
    tone = 'offline-banner--warn';
  } else if (showOffline && !canSellOffline && !posRoute.hasCatalog) {
    message = t('offline.noCatalog');
    tone = 'offline-banner--warn';
  } else if (forceOfflineMode) {
    message = t('offline.forceOfflineActive');
    tone = 'offline-banner--offline';
  } else if (showOffline) {
    message = t('offline.workingOffline');
    tone = 'offline-banner--offline';
  } else if (showPending) {
    message = t('offline.pendingSales', { count: pendingSales });
    tone = 'offline-banner--pending';
  } else if (!bootstrapReady && apiOnline) {
    message = t('offline.preparingCatalog');
  } else if (showCatalogStrip && catalogLabel) {
    message = t('offline.catalogFresh', {
      date: catalogLabel,
      count: productCount,
    });
  }

  return (
    <div className={`offline-banner ${tone}`} role="status">
      <span className="offline-banner__icon">
        {showOffline ? <CloudOff size={16} aria-hidden /> : <Wifi size={16} aria-hidden />}
      </span>
      <span className="offline-banner__text">{message}</span>
      <div className="offline-banner__actions">
        {offlineAllowed && !forceOfflineMode && canSellOffline ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            onClick={() => handleToggleForceOffline(true)}
          >
            <CloudOff size={14} aria-hidden />
            {t('offline.switchToOffline')}
          </button>
        ) : null}
        {offlineAllowed && forceOfflineMode ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            onClick={() => handleToggleForceOffline(false)}
          >
            <Wifi size={14} aria-hidden />
            {t('offline.switchToOnline')}
          </button>
        ) : null}
        {showPending && apiOnline && !forceOfflineMode ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            disabled={syncing}
            onClick={handleSyncSales}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} aria-hidden />
            {syncing ? t('offline.syncing') : t('offline.syncSales')}
          </button>
        ) : null}
        {apiOnline && !forceOfflineMode && !networkOffline ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            disabled={syncingCatalog}
            onClick={handleRefreshCatalog}
          >
            <RefreshCw size={14} className={syncingCatalog ? 'spin' : ''} aria-hidden />
            {syncingCatalog ? t('offline.updatingCatalog') : t('offline.updateCatalog')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
