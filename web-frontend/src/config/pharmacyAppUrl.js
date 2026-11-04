/**
 * Base URL of the standalone pharmacy SPA.
 * Empty = pharmacy stays inside web-frontend (/pharm).
 * Local: http://localhost:5175
 * Prod/lab: https://p-aurent.uz
 */
export function getPharmacyAppUrl() {
  const raw = String(import.meta.env.VITE_PHARMACY_APP_URL || '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

export function isPharmacyAppSplitEnabled() {
  return Boolean(getPharmacyAppUrl());
}
