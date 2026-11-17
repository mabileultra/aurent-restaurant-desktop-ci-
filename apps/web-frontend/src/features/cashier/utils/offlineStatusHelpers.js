import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConnectivityStore, refreshConnectivityStatus } from '../../../store/connectivityStore';
import { pushPendingSales, refreshCatalogBootstrap } from '../../../services/offline/offlineSyncService';

export function formatCatalogSyncAt(iso) {
  if (!iso) return null;
  try {
    return format(new Date(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return iso;
  }
}

export function invalidatePosData(qc, storeId) {
  qc.invalidateQueries({ queryKey: ['pos-categories'] });
  qc.invalidateQueries({ queryKey: ['pos-products'] });
  if (storeId) {
    qc.invalidateQueries({ queryKey: ['cashier-shift'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
  }
}

/**
 * Computes human-readable message, topbar short label, and tone.
 */
export function resolveOfflineStatusMessage({
  notAllowed,
  desktopShell,
  visible,
  forceOfflineMode,
  posRoute,
  showOffline,
  canSellOffline,
  showPending,
  pendingSales,
  catalogBusy,
  syncPhaseLabel,
  bootstrapReady,
  apiOnline,
  lastSyncError,
  showCatalogStrip,
  catalogLabel,
  productCount,
  t,
}) {
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
  } else if (forceOfflineMode && !posRoute?.hasCatalog) {
    message = t('offline.forceOfflineNoCatalog');
    shortLabel = t('offline.topbarNoCatalog');
    tone = 'warn';
  } else if (showOffline && !canSellOffline && !posRoute?.hasCatalog) {
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
    message = syncPhaseLabel || t('offline.preparingCatalog');
    shortLabel = syncPhaseLabel || t('offline.topbarSyncing');
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

  return { message, shortLabel, tone };
}

export async function executeOfflineSyncSales({ catalogKind, t }) {
  const store = useConnectivityStore.getState();
  store.setSyncing(true);
  store.setSyncPhase('sales');
  toast.loading(t('offline.phaseSales'), { id: 'pos-sync-sales' });
  try {
    await pushPendingSales({ catalogKind });
    store.setSyncResult({ ok: true });
    await refreshConnectivityStatus();
    toast.success(t('offline.phaseDone'), { id: 'pos-sync-sales' });
  } catch (err) {
    useConnectivityStore.getState().setSyncResult({
      ok: false,
      error: err?.message || String(err),
    });
    toast.error(t('offline.phaseError'), { id: 'pos-sync-sales' });
  }
}

export async function executeOfflineCatalogRefresh({
  storeId,
  forceOfflineMode,
  networkOffline,
  catalogKind,
  qc,
  t,
}) {
  if (!storeId) return;
  if (forceOfflineMode || networkOffline) {
    toast.error(t('offline.updateCatalogNeedsInternet'));
    return;
  }
  const store = useConnectivityStore.getState();
  store.setSyncingCatalog(true);
  store.setSyncPhase('catalog');
  toast.loading(t('offline.phaseCatalog'), { id: 'pos-sync-catalog' });
  try {
    const result = await refreshCatalogBootstrap(storeId, { force: true, catalogKind });
    if (result?.skipped && result?.reason === 'error') {
      throw new Error(t('offline.updateCatalogFailed'));
    }
    store.setSyncResult({ ok: true });
    await refreshConnectivityStatus();
    invalidatePosData(qc, storeId);
    if (!result?.skipped) {
      toast.success(t('offline.catalogUpdated', { count: result?.productCount ?? 0 }), {
        id: 'pos-sync-catalog',
      });
    } else {
      toast.success(t('offline.phaseDone'), { id: 'pos-sync-catalog' });
    }
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || t('offline.updateCatalogFailed');
    useConnectivityStore.getState().setSyncResult({
      ok: false,
      error: message,
    });
    toast.error(message, { id: 'pos-sync-catalog' });
  } finally {
    useConnectivityStore.getState().setSyncingCatalog(false);
  }
}
