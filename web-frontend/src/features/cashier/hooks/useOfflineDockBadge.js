import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { useConnectivityStore } from '../../../store/connectivityStore';
import { resolvePosRoute } from '../../../services/pos/posRouteResolver';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';
import { userHasCashierOfflineAccess } from '../../../utils/cashierOfflineAccess';
import { isDesktopCashier } from '../../../utils/authLogin';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { resolveOfflineDockBadge } from './resolveOfflineDockBadge';

function sameDockBadge(a, b) {
  return (
    a.tone === b.tone
    && a.labelKey === b.labelKey
    && a.showOffline === b.showOffline
    && a.networkOffline === b.networkOffline
  );
}

export function useOfflineDockBadge() {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const user = useAuthStore((s) => s.user);
  const offlineAllowed = userHasCashierOfflineAccess(user);
  const hasBridge = isDesktopOfflineBridge();
  const isDesktopShell = isDesktopCashier();

  const badge = useConnectivityStore(
    (s) => {
      const route = resolvePosRoute(storeId, s);
      const networkOffline = Boolean(s.offlineMode || !s.apiOnline);
      const forceOfflineMode = Boolean(s.forceOfflineMode);
      const resolved = resolveOfflineDockBadge({
        hasBridge,
        isDesktopShell,
        offlineAllowed,
        forceOfflineMode,
        networkOffline,
        hasCatalog: route.hasCatalog,
      });
      return {
        ...resolved,
        networkOffline,
        showOffline: Boolean(
          forceOfflineMode || networkOffline || route.route === 'local',
        ),
      };
    },
    sameDockBadge,
  );

  return {
    tone: badge.tone,
    showOffline: badge.showOffline,
    networkOffline: badge.networkOffline,
    shortLabel: t(badge.labelKey),
    message: t(badge.labelKey),
  };
}
