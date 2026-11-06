/** Типы магазинов, которым нужен ASL-ключ для продажи маркировки. */
export const ASL_MARKING_STORE_TYPES = new Set([
  'PHARMACY',
  'GROCERY',
  'UNIVERSAL',
  'CONSTRUCTION',
  'RESTAURANT',
  'CANTEEN',
]);

export function storeSupportsAslMarking(businessType) {
  const code = String(businessType || '').trim().toUpperCase();
  return ASL_MARKING_STORE_TYPES.has(code);
}

export function storeIsPharmacy(businessType) {
  return String(businessType || '').trim().toUpperCase() === 'PHARMACY';
}
