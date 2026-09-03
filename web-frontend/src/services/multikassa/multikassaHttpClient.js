/**
 * HTTP к Multikassa: на desktop — через Electron IPC (localhost без CORS),
 * в браузере — прямой fetch (нужен CORS у агента или cloud).
 */
export async function multikassaHttpRequest({ baseUrl, method = 'GET', path, body }) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  const url = `${root}${suffix}`;

  const desktop = typeof window !== 'undefined' ? window.desktopCashier : null;
  if (desktop?.isDesktop && typeof desktop.multikassaRequest === 'function') {
    const result = await desktop.multikassaRequest({ method, url, body });
    if (!result?.ok) {
      const message =
        result?.data?.message ||
        result?.data?.error ||
        (typeof result?.data === 'string' ? result.data : null) ||
        `Multikassa HTTP ${result?.status || '?'}`;
      const err = new Error(message);
      err.status = result?.status;
      err.data = result?.data;
      throw err;
    }
    return result.data;
  }

  const headers = {
    Accept: 'application/json',
  };
  const init = { method, headers };
  if (body != null && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const message =
      data?.message || data?.error || (typeof data === 'string' ? data : null) || `Multikassa HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getContragents(baseUrl, { refresh = false } = {}) {
  const path = refresh ? '/api/v1/contragents?refresh=1' : '/api/v1/contragents';
  return multikassaHttpRequest({ baseUrl, method: 'GET', path });
}

export function getFiscalDrives(baseUrl) {
  return multikassaHttpRequest({ baseUrl, method: 'GET', path: '/api/v1/fiscal_drives' });
}

export function selectFiscalDrive(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/fiscal_drives/select',
    body,
  });
}

export function getPrinters(baseUrl) {
  return multikassaHttpRequest({ baseUrl, method: 'GET', path: '/api/v1/devices/printers' });
}

export function postOperation(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/operations',
    body,
  });
}
