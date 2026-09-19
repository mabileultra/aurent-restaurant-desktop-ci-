export function isPharmacyErrorCode(code) {
  return typeof code === 'string' && code.startsWith('PHARM_');
}
