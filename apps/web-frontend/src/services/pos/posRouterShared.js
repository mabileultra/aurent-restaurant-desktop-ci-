import { pharmacyShiftApi, cashierShiftApi } from '../api';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import { isDesktopOfflineBridge } from '../offline/desktopOfflineBridge';
import { resolveOnlineCatalogTimeoutMs } from './posCheckoutTimeouts';
import { useConnectivityStore } from '../../store/connectivityStore';
import { resolvePosRoute } from './posRouteResolver';

export function connectivityState() {
  return useConnectivityStore.getState();
}

export function routeFor(storeId) {
  return resolvePosRoute(storeId, connectivityState());
}

export function onlineCatalogConfig(signal) {
  return {
    timeout: resolveOnlineCatalogTimeoutMs(),
    ...(signal ? { signal } : {}),
  };
}

export async function withRemoteFallback(storeId, remoteFn, localFn) {
  const { route, canFallback } = routeFor(storeId);
  if (route === 'local') {
    return localFn();
  }
  try {
    return await remoteFn();
  } catch (err) {
    if (canFallback && isDesktopOfflineBridge() && isApiUnreachableError(err)) {
      return localFn();
    }
    throw err;
  }
}

export function shiftApi(catalogKind) {
  return catalogKind === 'pharmacy' ? pharmacyShiftApi : cashierShiftApi;
}
