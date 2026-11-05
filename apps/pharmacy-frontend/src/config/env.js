/** Bake-time / runtime public URLs for cross-SPA handoff. */

export function getApiBaseUrl() {
  return String(import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
}

export function getMainAppUrl() {
  return String(import.meta.env.VITE_MAIN_APP_URL || 'https://aurent.uz').replace(/\/$/, '');
}
