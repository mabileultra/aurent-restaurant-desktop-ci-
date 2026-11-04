/**
 * One-time session handoff via URL hash (`#handoff=…`).
 * On restaurant SPA only `/rst…` next paths are allowed.
 */

export function readHandoffFromHash() {
  const hash = String(window.location.hash || '').replace(/^#/, '');
  if (!hash.startsWith('handoff=')) return null;
  try {
    const raw = decodeURIComponent(hash.slice('handoff='.length));
    const data = JSON.parse(raw);
    if (!data?.token || typeof data.token !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

export function clearHandoffHash() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}

/** Only restaurant app paths. */
export function safeRestaurantNextPath(raw) {
  const p = String(raw || '').trim();
  if (!p.startsWith('/rst') || p.startsWith('//')) return '';
  if (p.includes('://')) return '';
  return p;
}
