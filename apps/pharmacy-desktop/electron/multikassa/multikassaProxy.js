const DEFAULT_TIMEOUT_MS = 8_000;
const OPERATION_TIMEOUT_MS = 25_000;

function resolveTimeoutMs(payload, url, method) {
  const explicit = Number(payload?.timeoutMs);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (method === 'POST' && /\/operations\b/i.test(url)) {
    return OPERATION_TIMEOUT_MS;
  }
  return DEFAULT_TIMEOUT_MS;
}

/**
 * Multikassa HTTP proxy — вызовы к localhost/cloud ФМ с машины кассира (без CORS).
 */
async function multikassaRequest(payload = {}, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  const method = String(payload.method || 'GET').toUpperCase();
  const url = String(payload.url || '').trim();
  if (!url) {
    throw new Error('multikassa url is required');
  }

  const headers = {
    Accept: 'application/json',
    ...(payload.headers || {}),
  };
  const init = { method, headers };

  if (payload.body != null && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json; charset=utf-8';
    init.body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
  }

  const timeoutMs = resolveTimeoutMs(payload, url, method);
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  if (controller) {
    init.signal = controller.signal;
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  let response;
  try {
    response = await fetchImpl(url, init);
  } catch (cause) {
    const isAbort = cause?.name === 'AbortError';
    const msg = String(cause?.message || cause || 'fetch failed');
    return {
      ok: false,
      status: 0,
      data: {
        message: isAbort
          ? `Таймаут запроса к Multikassa (${url}, ${timeoutMs} мс).`
          : /ECONNREFUSED|Failed to fetch|NetworkError|ENOTFOUND/i.test(msg)
            ? `Не удалось связаться с Multikassa (${url}). Запустите агент на кассе (localhost:8080 / :12346).`
            : msg,
        error: isAbort ? 'timeout' : msg,
      },
    };
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

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

module.exports = { multikassaRequest };
