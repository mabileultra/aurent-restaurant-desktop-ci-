/**
 * HTTP к локальной службе на машине кассира (FiscalDriveService и т.п.).
 * Desktop — через Electron IPC (без CORS, только loopback), браузер — прямой fetch.
 */
function pickErrorMessage(data) {
  if (data == null) return null;
  if (typeof data === 'string') return data;
  return data.message || data.Message || data.error || data.Error || data.title || data.Reason || null;
}

function buildError(message, { status, data, cause, code } = {}) {
  const err = new Error(message);
  if (status != null) err.status = status;
  if (data !== undefined) err.data = data;
  if (cause) err.cause = cause;
  if (code) err.code = code;
  return err;
}

function joinUrl(baseUrl, path) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  return `${root}${suffix}`;
}

function isHttpsPageWithoutDesktop(desktop) {
  return (
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    !desktop?.isDesktop
  );
}

async function viaDesktop(desktop, { method, url, body, headers }) {
  let result;
  try {
    result = await desktop.localDeviceRequest({ method, url, body, headers });
  } catch (cause) {
    throw buildError(String(cause?.message || cause), { cause, code: 'LOCAL_DEVICE_UNREACHABLE' });
  }
  if (!result?.ok) {
    throw buildError(pickErrorMessage(result?.data) || `HTTP ${result?.status || '?'}`, {
      status: result?.status,
      data: result?.data,
      code: result?.status ? undefined : 'LOCAL_DEVICE_UNREACHABLE',
    });
  }
  return result.data;
}

function encodeRequestBody(body, headers) {
  if (body == null) return { body: undefined, headers };
  if (typeof body === 'string') {
    return { body, headers };
  }
  const next = { ...headers };
  if (!next['Content-Type'] && !next['content-type']) {
    next['Content-Type'] = 'application/json; charset=utf-8';
  }
  return { body: JSON.stringify(body), headers: next };
}

async function viaFetch({ method, url, body, headers }) {
  const encoded = encodeRequestBody(body, { Accept: 'application/json', ...(headers || {}) });
  const init = { method, headers: encoded.headers };
  if (encoded.body != null && method !== 'GET' && method !== 'HEAD') {
    init.body = encoded.body;
  }
  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw buildError(`Локальная служба недоступна (${url}): ${cause?.message || cause}`, {
      cause,
      code: 'LOCAL_DEVICE_UNREACHABLE',
    });
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
    throw buildError(pickErrorMessage(data) || `HTTP ${response.status}`, { status: response.status, data });
  }
  return data;
}

export async function localDeviceHttpRequest({ baseUrl, method = 'GET', path, body, headers }) {
  const url = joinUrl(baseUrl, path);
  const upper = String(method).toUpperCase();
  const desktop = typeof window !== 'undefined' ? window.desktopCashier : null;

  if (desktop?.isDesktop) {
    if (typeof desktop.localDeviceRequest !== 'function') {
      throw buildError(
        'Обновите Aurent Desktop до 1.2.38 или новее — в этой версии нет доступа к FiscalDrive на localhost.',
        { code: 'LOCAL_DEVICE_DESKTOP_OLD' },
      );
    }
    return viaDesktop(desktop, { method: upper, url, body, headers });
  }
  if (isHttpsPageWithoutDesktop(desktop)) {
    throw buildError(
      'FiscalDrive на localhost недоступен из браузера (HTTPS → HTTP). Откройте кассу в Aurent Desktop 1.2.38+.',
      { code: 'LOCAL_DEVICE_BROWSER_HTTPS' },
    );
  }
  return viaFetch({ method: upper, url, body, headers });
}
