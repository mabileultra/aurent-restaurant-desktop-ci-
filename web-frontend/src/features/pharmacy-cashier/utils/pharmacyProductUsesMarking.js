/** Товар требует / уже в режиме маркировки на кассе. */
export function pharmacyProductUsesMarking(product) {
  if (!product) return false;
  if (product.markedProduct === true) return true;
  if (product.productMark || product.markCode) return true;
  return false;
}
