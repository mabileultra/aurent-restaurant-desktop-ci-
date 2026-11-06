/**
 * Keep current path when jumping from cloud origin to hall LAN hub.
 */
export function buildLanSwitchHref(lanHubUrl, location = typeof window !== 'undefined' ? window.location : null) {
  const base = String(lanHubUrl || '').replace(/\/+$/, '');
  if (!base || !location) return base || '';
  const path = `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
