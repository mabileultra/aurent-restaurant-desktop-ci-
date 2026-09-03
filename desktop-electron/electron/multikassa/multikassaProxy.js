/**
 * Multikassa HTTP proxy — вызовы к localhost/cloud ФМ с машины кассира (без CORS).
 */
async function multikassaRequest(payload = {}) {
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

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

module.exports = { multikassaRequest };
