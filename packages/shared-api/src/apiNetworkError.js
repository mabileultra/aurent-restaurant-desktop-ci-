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

export const AURENT_NETWORK_OFFLINE_EVENT = 'aurent:network-offline';
export const AURENT_NETWORK_ONLINE_EVENT = 'aurent:network-online';

let lastOfflineNotificationAt = 0;

export function notifyNetworkOffline(detail) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastOfflineNotificationAt < 1000) return;
  lastOfflineNotificationAt = now;
  window.dispatchEvent(new CustomEvent(AURENT_NETWORK_OFFLINE_EVENT, { detail }));
}

export function notifyNetworkOnline(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AURENT_NETWORK_ONLINE_EVENT, { detail }));
}
