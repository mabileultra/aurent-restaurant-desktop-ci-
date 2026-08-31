import { useAuthStore } from '../store/authStore';
import { isAuthPage, redirectToLogin } from './authLogin';
import { isJwtExpired } from './jwtToken';
import { logoutAndResetSession } from './authSession';

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

/** Сброс сессии и переход на PIN/логин, если мы не уже на экране входа. */
export function forceAuthReLogin() {
  logoutAndResetSession();
  if (typeof window === 'undefined') return;
  if (!isAuthPage(window.location.pathname)) {
    redirectToLogin();
  }
}

/** true — сессия протухла и выполнен redirect. */
export function redirectIfStoredTokenExpired() {
  const token = readStoredAuthToken();
  if (!token || !isJwtExpired(token)) return false;
  forceAuthReLogin();
  return true;
}

export function shouldForceReLoginAfterAuthFailure(error, token = readStoredAuthToken()) {
  if (!token) return false;
  if (isJwtExpired(token)) return true;
  if (isRefreshTokenRejected(error)) return true;
  return false;
}
