/** In-app path only — blocks open redirects. */
export function safeNextPath(raw) {
  const p = String(raw || '').trim();
  if (!p.startsWith('/') || p.startsWith('//')) return '';
  if (p.includes('://')) return '';
  return p;
}
