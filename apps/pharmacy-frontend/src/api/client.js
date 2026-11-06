import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getApiBaseUrl } from '../config/env';
import {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from '../utils/idempotencyKey';
import { forceAuthReLogin } from '../utils/authSessionExpiry';
import { isPublicAppPath } from '../utils/publicAppPaths';
import { isApiNetworkError, notifyNetworkOffline, notifyNetworkOnline } from '../utils/apiNetworkError';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';
import {
  markApiUnreachable,
  refreshConnectivityStatus,
} from '../store/connectivityStore';
import { normalizeCompanyLoginCode } from '../utils/authLogin';

let connectivityRefreshTimer;
let isAppMarkedOffline = false;

function scheduleConnectivityRefreshFromApi() {
  if (!isDesktopOfflineBridge()) return;
  if (connectivityRefreshTimer) return;
  connectivityRefreshTimer = window.setTimeout(() => {
    connectivityRefreshTimer = null;
    refreshConnectivityStatus();
  }, 800);
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
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
    if (config.headers) {
      if (config.idempotencyKey && !config.headers[IDEMPOTENCY_HEADER]) {
        config.headers[IDEMPOTENCY_HEADER] = config.idempotencyKey;
      }
      if (!config.headers[IDEMPOTENCY_HEADER]
        && (config.idempotent || isFinancialOrCriticalEndpoint(config.url, config.method))) {
        config.headers[IDEMPOTENCY_HEADER] = generateIdempotencyKey();
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    scheduleConnectivityRefreshFromApi();
    if (isAppMarkedOffline) {
      isAppMarkedOffline = false;
      notifyNetworkOnline();
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isNetworkOrProxyFail =
      status === 502 || status === 503 || status === 504 || isApiNetworkError(error);

    if (isNetworkOrProxyFail) {
      isAppMarkedOffline = true;
      notifyNetworkOffline(error);
      if (isDesktopOfflineBridge()) {
        markApiUnreachable();
        scheduleConnectivityRefreshFromApi();
      }
    }

    if (
      isDesktopOfflineBridge()
      && (isApiNetworkError(error) || status === 502 || status === 503 || status === 504)
    ) {
      return Promise.reject(error);
    }

    if (!original?._retry && status === 401) {
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
          ...prevUser,
          ...profile,
          companyLoginCode: companyLoginCode || prevUser?.companyLoginCode,
        });
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        forceAuthReLogin();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
