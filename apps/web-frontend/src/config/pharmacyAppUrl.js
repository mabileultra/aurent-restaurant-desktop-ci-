/**
 * Base URL of the standalone pharmacy SPA.
 * Local: http://localhost:5175
 * Prod:  https://p-aurent.uz
 */
export function getPharmacyAppUrl() {
  const raw = String(import.meta.env.VITE_PHARMACY_APP_URL || '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

export function isPharmacyAppSplitEnabled() {
  return Boolean(getPharmacyAppUrl());
}

/** Absolute URL on p-aurent (path must start with /). */
export function pharmacyAppHref(path = '/') {
  const base = getPharmacyAppUrl();
  if (!base) return '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
