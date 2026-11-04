export function isPharmacyBusinessType(code) {
  return String(code || '').trim().toUpperCase() === 'PHARMACY';
}
