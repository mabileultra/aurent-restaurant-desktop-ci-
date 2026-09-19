/** Строка маркированного товара без КМ — нельзя фискализировать / продавать. */
export function cartLineNeedsMarking(line) {
  if (!line?.markedProduct) return false;
  if (Array.isArray(line.productMarks) && line.productMarks.some((m) => String(m || '').trim())) {
    return false;
  }
  if (String(line.productMark || line.markCode || '').trim()) return false;
  return true;
}

export function cartHasUnmarkedMarkedLines(items) {
  return (items ?? []).some(cartLineNeedsMarking);
}
