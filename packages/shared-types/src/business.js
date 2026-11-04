/** Cross-app company / catalog vertical codes. */
export const BUSINESS_TYPE = Object.freeze({
  GROCERY: 'GROCERY',
  PHARMACY: 'PHARMACY',
  RESTAURANT: 'RESTAURANT',
});

export const CATALOG_KIND = Object.freeze({
  grocery: 'grocery',
  pharmacy: 'pharmacy',
  restaurant: 'restaurant',
});

export function normalizeBusinessType(code) {
  return String(code || '').trim().toUpperCase();
}

export function isPharmacyBusinessType(code) {
  return normalizeBusinessType(code) === BUSINESS_TYPE.PHARMACY;
}

export function isRestaurantBusinessType(code) {
  return normalizeBusinessType(code) === BUSINESS_TYPE.RESTAURANT;
}
