import { safeNextPath } from './safeNextPath.js';

/**
 * Target SPA accept URL: /auth/accept?code=…&next=…
 * JWT must never appear in the URL.
 */
export function buildHandoffAcceptUrl(baseUrl, { code, next = '/' } = {}) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  if (!base || !code) return '';
  const url = new URL('/auth/accept', `${base}/`);
  url.searchParams.set('code', String(code));
  const safe = safeNextPath(next) || '/';
  url.searchParams.set('next', safe);
  return url.toString();
}
