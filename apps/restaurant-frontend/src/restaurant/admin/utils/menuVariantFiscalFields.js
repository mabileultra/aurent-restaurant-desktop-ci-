/** Fiscal (Tasnif) fields shared across dish size variants. */

export function menuVariantFiscalFields(item) {
  if (!item) {
    return {
      ikpu: null,
      packageCode: null,
      unitOfMeasure: null,
      unitMeasureCode: null,
      barcode: null,
      markedProduct: false,
    };
  }
  return {
    ikpu: item.ikpu?.trim?.() || item.ikpu || null,
    packageCode: item.packageCode?.trim?.() || item.packageCode || null,
    unitOfMeasure: item.unitOfMeasure?.trim?.() || item.unitOfMeasure || null,
    unitMeasureCode: item.unitMeasureCode?.trim?.() || item.unitMeasureCode || null,
    barcode: item.barcode?.trim?.() || item.barcode || null,
    markedProduct: Boolean(item.markedProduct),
  };
}

/** Prefer the row being edited; else any family member that still has ИКПУ. */
export function resolveMenuVariantFiscal(current, family = []) {
  const own = menuVariantFiscalFields(current);
  if (own.ikpu) return own;
  for (const row of family) {
    const next = menuVariantFiscalFields(row);
    if (next.ikpu) return next;
  }
  return own;
}
