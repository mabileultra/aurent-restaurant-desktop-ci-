import { extractGtinFromMarkingCode, normalizePharmacyMarkingCode } from './pharmacyMarkingCode';

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function productBarcodeDigits(product) {
  const values = [
    product?.barcode,
    ...(Array.isArray(product?.barcodes) ? product.barcodes : []),
    ...(Array.isArray(product?.additionalBarcodes) ? product.additionalBarcodes : []),
  ];
  return values.map(digitsOnly).filter(Boolean);
}

function gtinVariants(gtin14) {
  const d = digitsOnly(gtin14);
  if (!d) return [];
  const variants = new Set([d]);
  if (d.length === 14 && d.startsWith('0')) variants.add(d.slice(1));
  if (d.length === 13) variants.add(`0${d}`);
  return [...variants];
}

/** Найти товар в каталоге по коду маркировки / GTIN. */
export function findProductByMarkingCode(products, rawCode) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const normalized = normalizePharmacyMarkingCode(rawCode).toLowerCase();
  const gtin = extractGtinFromMarkingCode(rawCode);
  const gtinSet = new Set(gtinVariants(gtin));

  const byExactBarcode = products.find((p) => {
    const barcode = String(p.barcode ?? '').trim().toLowerCase();
    return barcode && (barcode === normalized || barcode === rawCode.trim().toLowerCase());
  });
  if (byExactBarcode) return byExactBarcode;

  if (gtinSet.size > 0) {
    const byGtin = products.find((p) => productBarcodeDigits(p).some((barcode) => gtinSet.has(barcode)));
    if (byGtin) return byGtin;
  }

  return null;
}
