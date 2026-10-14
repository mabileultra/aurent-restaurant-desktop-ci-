/**
 * HTTP к локальным службам кассы (FiscalDriveService и т.п.) — без CORS из renderer.
 * Только loopback: renderer не должен ходить через main-процесс на произвольные хосты.
 */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

function parseLoopbackUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) return null;
  return parsed;
}

async function localDeviceRequest(payload = {}) {
  const method = String(payload.method || 'GET').toUpperCase();
  const parsed = parseLoopbackUrl(payload.url);
  if (!parsed) {
    return {
      ok: false,
      status: 0,
      data: { message: 'Разрешены только адреса localhost / 127.0.0.1', error: 'LOCAL_DEVICE_URL_REJECTED' },
    };
  }

  const headers = { Accept: 'application/json', ...(payload.headers || {}) };
  const init = { method, headers };
  if (payload.body != null && method !== 'GET' && method !== 'HEAD') {
    if (typeof payload.body === 'string') {
      init.body = payload.body;
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
      }
    } else {
      headers['Content-Type'] = headers['Content-Type'] || headers['content-type'] || 'application/json; charset=utf-8';
      init.body = JSON.stringify(payload.body);
    }
  }
  const timeoutMs = Number(payload.timeoutMs) > 0 ? Number(payload.timeoutMs) : 15000;
  init.signal = AbortSignal.timeout(timeoutMs);

  let response;
  try {
    response = await fetch(parsed.toString(), init);
  } catch (cause) {
    const msg = String(cause?.message || cause || 'fetch failed');
    return {
      ok: false,
      status: 0,
      data: { message: `Локальная служба недоступна (${parsed.origin}): ${msg}`, error: 'LOCAL_DEVICE_UNREACHABLE' },
    };
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
  return { ok: response.ok, status: response.status, data };
}

module.exports = { localDeviceRequest, parseLoopbackUrl };
