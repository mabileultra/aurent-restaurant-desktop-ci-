import axios from 'axios';
import { getApiBaseUrl } from '../config/env';
import { useAuthStore } from '../store/authStore';
import { normalizeCompanyLoginCode } from './authLogin';
import { forceAuthReLogin } from './authSessionExpiry';
import { isPublicAppPath } from './publicAppPaths';

let inFlightRefreshPromise = null;

export function isValidJwtFormat(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

export function clearAuthSessionForPublicOrProtected() {
  if (typeof window !== 'undefined' && isPublicAppPath(window.location.pathname)) {
    useAuthStore.getState().logout();
    return;
  }
  forceAuthReLogin();
}

export function isAuthRejectionError(error) {
  const status = error?.response?.status;
  return status === 400 || status === 401 || status === 403;
}

export function extractBearerToken(headers) {
  if (!headers) return null;
  const raw = typeof headers.get === 'function'
    ? headers.get('Authorization')
    : (headers.Authorization ?? headers.authorization);
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function applyBearerToken(headers, token) {
  if (!headers || !token) return { Authorization: `Bearer ${token}` };
  if (typeof headers.set === 'function') {
    headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function refreshAuthSession({
  expectedToken = null,
  baseURL = getApiBaseUrl(),
  timeout = 15_000,
} = {}) {
  const state = useAuthStore.getState();
  const currentToken = state.token;

  if (!isValidJwtFormat(currentToken)) {
    clearAuthSessionForPublicOrProtected();
    throw new Error('Missing or malformed auth token');
  }

  if (expectedToken && currentToken !== expectedToken) {
    return { token: currentToken, profile: state.user, refreshed: false };
  }

  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  const tokenForRefresh = currentToken;
  const promise = (async () => {
    try {
      const res = await axios.post(`${baseURL}/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${tokenForRefresh}` },
        timeout,
      });
      const { token: newToken, ...profile } = res?.data || {};
      if (!isValidJwtFormat(newToken)) {
        throw new Error('Invalid refresh response token');
      }

      const latestState = useAuthStore.getState();
      if (!latestState.token) {
        throw new Error('Session cleared during token refresh');
      }
      if (latestState.token !== tokenForRefresh) {
        return { token: latestState.token, profile: latestState.user, refreshed: false };
      }

      const prevUser = latestState.user;
      const companyLoginCode =
        normalizeCompanyLoginCode(profile.companyLoginCode)
        || normalizeCompanyLoginCode(prevUser?.companyLoginCode);
      const nextUser = {
        ...prevUser,
        ...profile,
        ...(companyLoginCode ? { companyLoginCode } : {}),
      };
      latestState.setAuth(newToken, nextUser);
      return { token: newToken, profile: nextUser, refreshed: true };
    } catch (err) {
      if (isAuthRejectionError(err)) {
        clearAuthSessionForPublicOrProtected();
      }
      throw err;
    } finally {
      if (inFlightRefreshPromise === promise) {
        inFlightRefreshPromise = null;
      }
    }
  })();

  inFlightRefreshPromise = promise;
  return promise;
}

