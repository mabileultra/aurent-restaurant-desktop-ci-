/** Карточка с галочкой «только маркировка»: склад по КМ/GTIN, не по ИКПУ. */
export function isMarkingOnlyProduct(product) {
  return product?.markedProduct === true;
}
