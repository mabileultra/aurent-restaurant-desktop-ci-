import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getApiBaseUrl } from '../config/env';
import {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from '../utils/idempotencyKey';
import {
  applyBearerToken,
  clearAuthSessionForPublicOrProtected,
  extractBearerToken,
  isValidJwtFormat,
  refreshAuthSession,
} from '../utils/refreshAuthSession';
import { isApiNetworkError, notifyNetworkOffline, notifyNetworkOnline } from '../utils/apiNetworkError';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';
import {
  markApiUnreachable,
  refreshConnectivityStatus,
} from '../store/connectivityStore';

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

    if (!original?._retry && status === 401 && !String(original?.url || '').includes('/auth/refresh')) {
      original._retry = true;
      const { token } = useAuthStore.getState();
      if (!isValidJwtFormat(token)) {
        clearAuthSessionForPublicOrProtected();
        return Promise.reject(error);
      }
      try {
        const sentToken = extractBearerToken(original.headers);
        const { token: newToken } = await refreshAuthSession({
          expectedToken: sentToken,
          baseURL: api.defaults.baseURL,
          timeout: api.defaults.timeout ?? 15_000,
        });
        original.headers = applyBearerToken(original.headers, newToken);
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
