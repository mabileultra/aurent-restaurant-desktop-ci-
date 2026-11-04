/**
 * Grocery scale PLU labels are out of scope on pharmacy SPA.
 * Always null so barcode path never calls /scales.
 */
export async function tryResolveWeightPluProduct() {
  return null;
}
