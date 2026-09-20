/** Main Aurent SPA (POS / platform / shared stock-catalog). */
export function getMainAppUrl() {
  const raw = String(import.meta.env.VITE_MAIN_APP_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  return 'http://localhost:5173';
}
