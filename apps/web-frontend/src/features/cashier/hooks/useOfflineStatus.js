import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierStoreProfile } from '../../../hooks/useCashierStoreProfile';
import { useAuthStore } from '../../../store/authStore';
import { userHasCashierOfflineAccess } from '../../../utils/cashierOfflineAccess';
import { isDesktopCashier } from '../../../utils/authLogin';
import {
  useConnectivityStore,
  usePosRoute,
} from '../../../store/connectivityStore';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';
import { SYNC_PHASE_I18N, isActiveSyncPhase } from '../../../services/offline/syncPhase';
import {
  formatCatalogSyncAt,
  resolveOfflineStatusMessage,
  executeOfflineSyncSales,
  executeOfflineCatalogRefresh,
} from '../utils/offlineStatusHelpers';
import { executeToggleForceOffline } from '../utils/offlineForceToggle';

export function useOfflineStatus() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const catalogKind = isPharmacy ? 'pharmacy' : 'grocery';
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const forceOfflineMode = useConnectivityStore((s) => s.forceOfflineMode);
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const syncing = useConnectivityStore((s) => s.syncing);
  const syncingCatalog = useConnectivityStore((s) => s.syncingCatalog);
  const syncPhase = useConnectivityStore((s) => s.syncPhase);
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
  const syncPhaseActive = isActiveSyncPhase(syncPhase);
  const syncPhaseLabel = syncPhaseActive || syncPhase === 'done' || syncPhase === 'error'
    ? t(SYNC_PHASE_I18N[syncPhase] || 'offline.syncing')
    : null;
  const catalogBusy = Boolean(
    syncPhaseActive || syncingCatalog || (syncing && !bootstrapReady && visible),
  );
  const canToggle = Boolean(forceOfflineMode || offlineAllowed);

  const handleToggleForceOffline = useCallback(
    (enabled) => executeToggleForceOffline({ enabled, storeId, canSellOffline, catalogKind, posRoute, qc, t }),
    [canSellOffline, catalogKind, posRoute, qc, storeId, t]
  );

  const handleSyncSales = useCallback(
    () => executeOfflineSyncSales({ catalogKind, t }),
    [catalogKind, t]
  );

  const handleRefreshCatalog = useCallback(
    () => executeOfflineCatalogRefresh({ storeId, forceOfflineMode, networkOffline, catalogKind, qc, t }),
    [catalogKind, forceOfflineMode, networkOffline, qc, storeId, t]
  );

  const { message, shortLabel, tone } = resolveOfflineStatusMessage({
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
  });

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
    syncPhase,
    syncPhaseActive,
    syncPhaseLabel,
    canToggle,
    hasOfflineBridge: visible,
    actions: {
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
