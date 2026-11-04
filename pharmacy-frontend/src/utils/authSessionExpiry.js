import { useAuthStore } from '../store/authStore';
import { isAuthPage, redirectToLogin } from './authLogin';
import { isJwtExpired } from './jwtToken';
import { logoutAndResetSession } from './authSession';
import { isPublicAppPath } from './publicAppPaths';

export function readStoredAuthToken() {
  return useAuthStore.getState().token;
}

export function isAuthHttpError(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

export function isRefreshTokenRejected(error) {
  const status = error?.response?.status;
  const msg = String(error?.response?.data?.message ?? '');
  return status === 400 && /invalid or expired token/i.test(msg);
}

/** Сброс сессии; redirect только на защищённых страницах. */
export function forceAuthReLogin() {
  logoutAndResetSession();
  if (typeof window === 'undefined') return;
  const { pathname } = window.location;
  if (isAuthPage(pathname) || isPublicAppPath(pathname)) return;
  redirectToLogin();
}

/** true — сессия протухла и выполнен redirect (на публичных — тихий сброс). */
export function redirectIfStoredTokenExpired() {
  const token = readStoredAuthToken();
  if (!token || !isJwtExpired(token)) return false;

  if (typeof window !== 'undefined' && isPublicAppPath(window.location.pathname)) {
    logoutAndResetSession();
    return false;
  }

  forceAuthReLogin();
  return true;
}

export function shouldForceReLoginAfterAuthFailure(error, token = readStoredAuthToken()) {
  if (!token) return false;
  if (isJwtExpired(token)) return true;
  if (isRefreshTokenRejected(error)) return true;
  return false;
}
