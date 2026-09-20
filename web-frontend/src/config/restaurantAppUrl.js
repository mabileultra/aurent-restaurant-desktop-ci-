/**
 * Base URL of the standalone restaurant SPA.
 * Empty = restaurant stays inside web-frontend (/rst).
 * Local: http://localhost:5174
 * Prod:  https://r-aurent.uz
 */
export function getRestaurantAppUrl() {
  const raw = String(import.meta.env.VITE_RESTAURANT_APP_URL || '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

export function isRestaurantAppSplitEnabled() {
  return Boolean(getRestaurantAppUrl());
}
