/** Карточка товара из строки прихода — модалка сама догрузит полные поля. */
export function productStubFromReceiptLine(line) {
  if (!line?.productId) return null;
  return {
    id: line.productId,
    name: line.productName,
    sku: line.sku,
    barcode: line.barcode,
    ikpu: line.ikpu,
    manufacturer: line.manufacturer,
    country: line.country,
    attributes: {
      manufacturer: line.manufacturer,
      country: line.country,
      units_in_pack: String(line.unitsInPack || 1),
    },
  };
}
