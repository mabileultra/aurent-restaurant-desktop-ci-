import toast from 'react-hot-toast';
import { useConnectivityStore, refreshConnectivityStatus } from '../../../store/connectivityStore';
import { refreshCatalogBootstrap } from '../../../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';
import { invalidatePosData } from './offlineStatusHelpers';

export async function executeToggleForceOffline({
  enabled,
  storeId,
  canSellOffline,
  catalogKind,
  posRoute,
  qc,
  t,
}) {
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
    } catch {}
    return;
  }

  if (!storeId) {
    toast.error(t('offline.noCatalog'), { id: toastId });
    return;
  }

  let ready = Boolean(canSellOffline || posRoute?.hasCatalog);

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
      const result = await refreshCatalogBootstrap(storeId, { force: true, catalogKind });
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
}
