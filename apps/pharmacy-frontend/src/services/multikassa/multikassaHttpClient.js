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

const DEFAULT_HTTP_TIMEOUT_MS = 8_000;
const OPERATION_HTTP_TIMEOUT_MS = 25_000;
const printerListPathCache = new Map();

export function clearMultikassaHttpCaches() {
  printerListPathCache.clear();
}

function resolveRequestTimeoutMs(timeoutMs, method, suffix) {
  const explicit = Number(timeoutMs);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (method === 'POST' && /\/operations\b/i.test(suffix)) {
    return OPERATION_HTTP_TIMEOUT_MS;
  }
  return DEFAULT_HTTP_TIMEOUT_MS;
}

export async function multikassaHttpRequest({ baseUrl, method = 'GET', path, body, timeoutMs }) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  const url = `${root}${suffix}`;
  const upperMethod = String(method || 'GET').toUpperCase();
  const effectiveTimeoutMs = resolveRequestTimeoutMs(timeoutMs, upperMethod, suffix);

  const desktop = typeof window !== 'undefined' ? window.desktopCashier : null;
  if (desktop?.isDesktop && typeof desktop.multikassaRequest === 'function') {
    let result;
    try {
      result = await desktop.multikassaRequest({
        method: upperMethod,
        url,
        body,
        timeoutMs: effectiveTimeoutMs,
      });
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
  const init = { method: upperMethod, headers };
  if (body != null && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    init.body = JSON.stringify(body);
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  if (controller) {
    init.signal = controller.signal;
    timer = setTimeout(() => controller.abort(), effectiveTimeoutMs);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    if (cause?.name === 'AbortError') {
      const err = new Error(`Таймаут запроса к Multikassa (${effectiveTimeoutMs} мс)`);
      err.code = 'MULTIKASSA_TIMEOUT';
      err.cause = cause;
      throw err;
    }
    const err = new Error(connectionErrorMessage(url, cause));
    err.cause = cause;
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
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

/** Некоторые сборки MK fiscal отдают drives под другими путями — пробуем по очереди. */
export async function getFiscalDrivesWithFallback(baseUrl) {
  const paths = [
    '/api/v1/fiscal_drives',
    '/api/v1/fiscal-drives',
    '/api/v1/fiscal_drives?refresh=1',
    '/api/v1/modules',
    '/api/v1/devices/fiscal',
  ];
  let lastErr = null;
  for (const path of paths) {
    try {
      const data = await multikassaHttpRequest({ baseUrl, method: 'GET', path });
      return { data, path };
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return { data: [], path: paths[0] };
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

/** Пробуем известные пути списка принтеров MK Fiscal. */
export async function getPrintersWithFallback(baseUrl) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  const defaultPaths = [
    '/api/v1/devices/printers',
    '/api/v1/printers',
    '/api/v1/devices/printer',
  ];
  const cachedPath = printerListPathCache.get(root);
  const paths = cachedPath
    ? [cachedPath, ...defaultPaths.filter((p) => p !== cachedPath)]
    : defaultPaths;

  let lastErr = null;
  for (const path of paths) {
    try {
      const data = await multikassaHttpRequest({ baseUrl: root, method: 'GET', path });
      printerListPathCache.set(root, path);
      return { data, path };
    } catch (err) {
      if (path === cachedPath && (err?.status === 404 || err?.status === 405)) {
        printerListPathCache.delete(root);
      }
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return { data: [], path: paths[0] };
}

export function selectPrinter(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/devices/printers/select',
    body,
  });
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
