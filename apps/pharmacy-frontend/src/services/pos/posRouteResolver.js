/**
 * Единая точка решения: SQLite или API для desktop-кассы.
 */
import {
  buildConnectivityContext,
  hasLocalPosCatalog,
} from '../offline/connectivityRules';
import { isDesktopOfflineBridge } from '../offline/desktopOfflineBridge';
import { userHasCashierOfflineAccess } from '../../utils/cashierOfflineAccess';
import { useAuthStore } from '../../store/authStore';

export function buildPosRouteContext(storeId, state) {
  const user = useAuthStore.getState().user;
  return buildConnectivityContext({
    isDesktop: isDesktopOfflineBridge(),
    offlineAllowed: userHasCashierOfflineAccess(user),
    state,
    storeId,
  });
}

/**
 * @returns {{ route: 'local'|'remote', offlineLike: boolean, hasCatalog: boolean, canFallback: boolean, forceOffline: boolean }}
 */
export function resolvePosRoute(storeId, state) {
  const ctx = buildPosRouteContext(storeId, state);
  const hasCatalog = hasLocalPosCatalog(state, storeId);

  if (!ctx.isDesktop || !ctx.offlineAllowed) {
    return {
      route: 'remote',
      offlineLike: false,
      hasCatalog,
      canFallback: false,
      forceOffline: Boolean(state?.forceOfflineMode),
    };
  }

  const useLocal = ctx.offlineLike && hasCatalog;

  return {
    route: useLocal ? 'local' : 'remote',
    offlineLike: ctx.offlineLike,
    hasCatalog,
    canFallback: hasCatalog,
    forceOffline: Boolean(state?.forceOfflineMode),
  };
}

export function shouldUseLocalPosRoute(storeId, state) {
  return resolvePosRoute(storeId, state).route === 'local';
}
