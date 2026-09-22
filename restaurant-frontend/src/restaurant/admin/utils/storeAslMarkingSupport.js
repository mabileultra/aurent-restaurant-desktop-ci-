/** Store types that may use ASL Belgisi / xTrace marking. */
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
