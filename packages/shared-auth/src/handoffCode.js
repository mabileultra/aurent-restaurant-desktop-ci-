/** Read one-time Identity handoff code from ?code= (never put JWT here). */
export function readHandoffCodeFromSearch(searchParams) {
  const code = String(searchParams?.get?.('code') || '').trim();
  return code || '';
}

/** Strip code from URL after exchange (history hygiene). */
export function clearHandoffCodeFromUrl(location = window.location, history = window.history) {
  const url = new URL(location.href);
  if (!url.searchParams.has('code')) return;
  url.searchParams.delete('code');
  const qs = url.searchParams.toString();
  history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
}
