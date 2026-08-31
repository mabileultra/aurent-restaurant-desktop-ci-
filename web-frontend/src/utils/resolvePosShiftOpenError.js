import { getApiErrorMessage } from './apiError';
import { isApiNetworkError, isApiUnreachableError } from './apiNetworkError';
import { isDesktopCashier } from './authLogin';
import {
  forceAuthReLogin,
  isAuthHttpError,
  isRefreshTokenRejected,
  readStoredAuthToken,
  shouldForceReLoginAfterAuthFailure,
} from './authSessionExpiry';
import { isJwtExpired } from './jwtToken';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';
import { resolvePosRoute } from '../services/pos/posRouteResolver';
import { useConnectivityStore } from '../store/connectivityStore';

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

/**
 * Человекочитаемая причина сбоя POST /cashier/shifts/open.
 */
export function resolvePosShiftOpenErrorMessage(error, t, storeId = null) {
  const code = error?.message;
  const token = readStoredAuthToken();

  if (
    shouldForceReLoginAfterAuthFailure(error, token)
    || (isAuthHttpError(error) && token && isJwtExpired(token))
    || isRefreshTokenRejected(error)
  ) {
    forceAuthReLogin();
    return t('login.sessionExpired');
  }

  if (code === 'OFFLINE_SHIFT_OPEN_FAILED' || code === 'offline_ipc_timeout') {
    return t('offline.shiftOpenFailed');
  }

  const connectivity = useConnectivityStore.getState();
  const { hasCatalog, offlineLike } = resolvePosRoute(storeId, connectivity);

  if (
    isApiUnreachableError(error)
    && isDesktopOfflineBridge()
    && offlineLike
    && !hasCatalog
  ) {
    return t('offline.openShiftNeedsCatalog');
  }

  if (isApiNetworkError(error) || isApiUnreachableError(error)) {
    return isDesktopCashier() ? t('login.networkError') : t('pos.shiftOpenNetworkError');
  }

  const status = error?.response?.status;
  const apiMsg = getApiErrorMessage(error, '');

  if (status === 502 || status === 503 || status === 504) {
    return t('login.serviceUnavailable');
  }

  if (status === 403 || apiMsg === 'Access denied') {
    return t('pos.shiftOpenForbidden');
  }

  if (apiMsg === GENERIC_SERVER_ERROR || error?.response?.data?.code === 'INTERNAL_ERROR') {
    return t('login.serverError');
  }

  if (apiMsg) {
    return apiMsg;
  }

  return t('pos.shiftOpenFailed');
}
