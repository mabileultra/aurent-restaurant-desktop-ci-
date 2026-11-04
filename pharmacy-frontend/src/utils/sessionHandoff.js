/** Safe in-app next path after handoff (no open redirect). */

export function safePharmacyNextPath(raw) {
  const p = String(raw || '').trim();
  if (!p.startsWith('/') || p.startsWith('//')) return '';
  if (p.includes('://')) return '';
  return p;
}

export function readHandoffCodeFromSearch(searchParams) {
  const code = String(searchParams?.get?.('code') || '').trim();
  return code || '';
}

/** Strip code from URL after exchange (history hygiene). */
export function clearHandoffCodeFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('code')) return;
  url.searchParams.delete('code');
  const qs = url.searchParams.toString();
  window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
}
