/**
 * Thin Identity handoff calls — pass the app's authenticated HTTP client.
 * @param {{ post: (url: string, body?: unknown) => Promise<{ data?: { code?: string, token?: string } }> }} http
 */

export function createHandoff(http, { audience }) {
  return http.post('/auth/handoff', { audience });
}

export function exchangeHandoff(http, code) {
  return http.post('/auth/handoff/exchange', { code: String(code || '').trim() });
}
