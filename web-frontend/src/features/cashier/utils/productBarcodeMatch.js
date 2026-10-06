function normalize(code) {
  return String(code ?? '').trim().toLowerCase();
}

export function productBarcodeList(product) {
  const list = [product?.barcode, ...(Array.isArray(product?.barcodes) ? product.barcodes : [])];
  return [...new Set(list.map((b) => String(b ?? '').trim()).filter(Boolean))];
}

export function findProductBarcode(product, code) {
  const target = normalize(code);
  if (!target) return null;
  return productBarcodeList(product).find((b) => b.toLowerCase() === target) ?? null;
}

/** Чек и строка корзины показывают код, которым пробили (основной или дополнительный). */
export function withScannedBarcode(product, code) {
  const matched = findProductBarcode(product, code);
  if (!matched || matched === product?.barcode) return product;
  return { ...product, barcode: matched };
}
