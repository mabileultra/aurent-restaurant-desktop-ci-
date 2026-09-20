import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { normalizeCompanyLoginCode } from '../utils/authLogin';
import { forceAuthReLogin } from '../utils/authSessionExpiry';
import { isPublicAppPath } from '../utils/publicAppPaths';
import { isApiNetworkError } from '../utils/apiNetworkError';
import {
  markApiUnreachable,
  refreshConnectivityStatus,
  useConnectivityStore,
} from '../store/connectivityStore';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

let connectivityRefreshTimer;

function scheduleConnectivityRefreshFromApi() {
  if (!isDesktopOfflineBridge()) return;
  if (connectivityRefreshTimer) return;
  connectivityRefreshTimer = window.setTimeout(() => {
    connectivityRefreshTimer = null;
    refreshConnectivityStatus();
  }, 800);
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    scheduleConnectivityRefreshFromApi();
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (
      isDesktopOfflineBridge() &&
      (status === 502 || status === 503 || status === 504 || isApiNetworkError(error))
    ) {
      markApiUnreachable();
      scheduleConnectivityRefreshFromApi();
    }
    const hasStoredToken = Boolean(useAuthStore.getState().token);
    const shouldAttemptRefresh =
      !original._retry && (status === 401 || (status === 403 && hasStoredToken));

    if (
      isDesktopOfflineBridge() &&
      (isApiNetworkError(error) || status === 502 || status === 503 || status === 504)
    ) {
      return Promise.reject(error);
    }
    if (shouldAttemptRefresh) {
      original._retry = true;
      const { token } = useAuthStore.getState();
      const jwtParts = typeof token === 'string' ? token.split('.').length : 0;
      if (!token || jwtParts !== 3) {
        if (typeof window !== 'undefined' && isPublicAppPath(window.location.pathname)) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
        forceAuthReLogin();
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: api.defaults.timeout ?? 15_000,
        });
        const { token: newToken, ...profile } = res.data;
        const prevUser = useAuthStore.getState().user;
        const companyLoginCode =
          normalizeCompanyLoginCode(profile.companyLoginCode)
          || normalizeCompanyLoginCode(prevUser?.companyLoginCode);
        useAuthStore.getState().setAuth(newToken, {
          ...profile,
          ...(companyLoginCode ? { companyLoginCode } : {}),
        });
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        if (isApiNetworkError(refreshErr)) {
          return Promise.reject(error);
        }
        if (typeof window !== 'undefined' && isPublicAppPath(window.location.pathname)) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
        forceAuthReLogin();
        return Promise.reject(refreshErr);
      }
    }
    if (status === 403) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
