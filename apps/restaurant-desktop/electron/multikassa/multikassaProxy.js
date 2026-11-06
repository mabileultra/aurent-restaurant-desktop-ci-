/**
 * Multikassa HTTP from the hall PC (no CORS from the local UI origin).
 */
async function multikassaRequest(payload = {}) {
  const method = String(payload.method || 'GET').toUpperCase();
  const url = String(payload.url || '').trim();
  if (!url) throw new Error('multikassa url is required');

  const headers = {
    Accept: 'application/json',
    ...(payload.headers || {}),
  };
  const init = { method, headers };
  if (payload.body != null && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json; charset=utf-8';
    init.body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    const msg = String(cause?.message || cause || 'fetch failed');
    return {
      ok: false,
      status: 0,
      data: {
        message:
          /ECONNREFUSED|Failed to fetch|NetworkError|ENOTFOUND/i.test(msg)
            ? `Не удалось связаться с Multikassa (${url}). Запустите агент (localhost:8080 / :12346).`
            : msg,
        error: msg,
      },
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

module.exports = { multikassaRequest };
