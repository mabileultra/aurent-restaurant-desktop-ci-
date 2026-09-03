/**
 * HTTP к Multikassa: на desktop — через Electron IPC (localhost без CORS),
 * в браузере — прямой fetch (нужен CORS у агента или cloud https).
 */
function isLocalMultikassaUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(String(url || ''));
  }
}

function connectionErrorMessage(url, cause) {
  const raw = String(cause?.message || cause || '');
  const local = isLocalMultikassaUrl(url);
  const onHttpsPage =
    typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const desktop = typeof window !== 'undefined' ? window.desktopCashier : null;
  const isDesktop = Boolean(desktop?.isDesktop);

  if (local && onHttpsPage && !isDesktop) {
    return (
      'Multikassa на localhost недоступна из браузера (HTTPS → HTTP). ' +
      'Откройте кассу в Aurent Desktop или укажите cloud base URL (v3/v4.mkfiscal.uz).'
    );
  }
  if (local && /Failed to fetch|NetworkError|Load failed|ECONNREFUSED/i.test(raw)) {
    return (
      'Не удалось связаться с Multikassa на ' +
      String(url).replace(/\/api\/v1\/.*$/, '') +
      '. Запустите агент/модуль (обычно :8080 или :12346), проверьте Terminal ID и смену.'
    );
  }
  return raw || 'Multikassa request failed';
}

export async function multikassaHttpRequest({ baseUrl, method = 'GET', path, body }) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  const url = `${root}${suffix}`;

  const desktop = typeof window !== 'undefined' ? window.desktopCashier : null;
  if (desktop?.isDesktop && typeof desktop.multikassaRequest === 'function') {
    let result;
    try {
      result = await desktop.multikassaRequest({ method, url, body });
    } catch (cause) {
      const err = new Error(connectionErrorMessage(url, cause));
      err.cause = cause;
      throw err;
    }
    if (!result?.ok) {
      const message =
        result?.data?.message ||
        result?.data?.error ||
        result?.data?.Message ||
        (typeof result?.data === 'string' ? result.data : null) ||
        connectionErrorMessage(url, `Multikassa HTTP ${result?.status || '?'}`);
      const err = new Error(message);
      err.status = result?.status;
      err.data = result?.data;
      throw err;
    }
    return result.data;
  }

  if (isLocalMultikassaUrl(url) && typeof window !== 'undefined' && window.location?.protocol === 'https:') {
    const err = new Error(connectionErrorMessage(url));
    err.code = 'MULTIKASSA_BROWSER_LOCALHOST';
    throw err;
  }

  const headers = {
    Accept: 'application/json',
  };
  const init = { method, headers };
  if (body != null && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    const err = new Error(connectionErrorMessage(url, cause));
    err.cause = cause;
    throw err;
  }

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
      data?.message ||
      data?.error ||
      data?.Message ||
      (typeof data === 'string' ? data : null) ||
      `Multikassa HTTP ${response.status}`;
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

export function getOperations(baseUrl) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'GET',
    path: '/api/v1/operations',
  });
}
