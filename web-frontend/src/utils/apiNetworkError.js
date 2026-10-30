import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

function isRequestCanceled(error) {
  const code = error?.code;
  const name = error?.name;
  return code === 'ERR_CANCELED' || name === 'CanceledError' || name === 'AbortError';
}

export function isApiNetworkError(error) {
  if (isRequestCanceled(error)) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!error) return false;
  const code = error.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  if (error.message && /network\s*error/i.test(error.message)) return true;

  // Detect gateway / proxy network outages (Vite proxy, Nginx, cloud balancer)
  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;

  const resData = error.response?.data;
  if (resData) {
    if (resData.error === 'NETWORK_UNREACHABLE' || resData.code === 'ENOTFOUND') return true;
    const resDataStr = typeof resData === 'string' ? resData : JSON.stringify(resData);
    if (/ENOTFOUND|ECONNREFUSED|EHOSTUNREACH|getaddrinfo/i.test(resDataStr)) return true;
  }

  return !error.response && Boolean(error.request);
}

/** Desktop: сеть/прокси недоступны — можно перейти на офлайн-продажу. */
export function isApiUnreachableError(error) {
  if (isApiNetworkError(error)) return true;
  if (!isDesktopOfflineBridge()) return false;
  const status = error?.response?.status;
  return status === 502 || status === 503 || status === 504;
}

export const AURENT_NETWORK_OFFLINE_EVENT = 'aurent:network-offline';
export const AURENT_NETWORK_ONLINE_EVENT = 'aurent:network-online';

let lastOfflineNotificationAt = 0;

/**
 * Broadcast network offline event across all app components and hooks.
 * Throttled to avoid flooding the event loop on batch failed requests.
 */
export function notifyNetworkOffline(detail) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastOfflineNotificationAt < 1000) return;
  lastOfflineNotificationAt = now;
  window.dispatchEvent(new CustomEvent(AURENT_NETWORK_OFFLINE_EVENT, { detail }));
}

/**
 * Broadcast network online event when connection is restored.
 */
export function notifyNetworkOnline(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AURENT_NETWORK_ONLINE_EVENT, { detail }));
}

