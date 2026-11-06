export function filterInventoryLines(lines, query) {
  const q = String(query || '').trim().toLowerCase();
  return (lines ?? []).map((line, index) => ({ line, index })).filter(({ line }) => {
    if (!q) return true;
    const hay = [line.product?.name, line.product?.sku, line.product?.barcode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q) || !line.productId;
  });
}
