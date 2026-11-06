/**
 * One-time session handoff via URL hash (`#handoff=…`).
 * Hash is not sent to servers; accept page stores JWT then clears the URL.
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

/** Allow only in-app absolute paths (no protocol / protocol-relative). */
export function safeNextPath(raw) {
  const p = String(raw || '').trim();
  if (!p.startsWith('/') || p.startsWith('//')) return '';
  if (p.includes('://')) return '';
  return p;
}
