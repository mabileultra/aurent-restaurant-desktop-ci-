import {
  barcodeLookupVariants,
  extractGtinFromMarkingCode,
  markingBarcodeCandidates,
  normalizeMarkingCode,
} from './markingCode';

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function productBarcodeDigits(product) {
  const values = [
    product?.barcode,
    product?.sku,
    ...(Array.isArray(product?.barcodes) ? product.barcodes : []),
    ...(Array.isArray(product?.additionalBarcodes) ? product.additionalBarcodes : []),
  ];
  return values.map(digitsOnly).filter((value) => value.length >= 8);
}

function gtinVariants(gtin14) {
  return barcodeLookupVariants(gtin14);
}

/** Найти товар в каталоге по коду маркировки / GTIN. */
export function findProductByMarkingCode(products, rawCode) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const normalized = normalizeMarkingCode(rawCode).toLowerCase();
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

  const markDigits = digitsOnly(normalized);
  if (markDigits.length >= 12) {
    const byEmbed = products.find((p) => productBarcodeDigits(p).some((barcode) => (
      barcode.length >= 8 && markDigits.includes(barcode)
    )));
    if (byEmbed) return byEmbed;
  }

  return null;
}

/** GTIN из КМ / ответа ASL совпадает со штрихкодом этой позиции. */
export function markingMatchesProduct(product, rawCode, extraGtins = []) {
  const barcodes = productBarcodeDigits(product);
  if (barcodes.length === 0) return false;

  const candidates = new Set(markingBarcodeCandidates(rawCode, extraGtins));
  const markDigits = digitsOnly(normalizeMarkingCode(rawCode));

  return barcodes.some((barcode) => {
    if (candidates.has(barcode)) return true;
    if (gtinVariants(barcode).some((variant) => candidates.has(variant))) return true;
    if (barcode.length >= 8 && markDigits.includes(barcode)) return true;
    if (barcode.length === 13 && markDigits.includes(`0${barcode}`)) return true;
    return false;
  });
}
