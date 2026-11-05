/** Галочка «только маркировка»: в чек с полки/штрихкода нельзя — только скан КМ. */
export function isMarkingOnlyProduct(product) {
  return product?.markedProduct === true;
}
