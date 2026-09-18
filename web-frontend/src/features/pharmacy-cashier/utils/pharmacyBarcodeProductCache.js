import { barcodeLookupVariants } from './pharmacyMarkingCode';

/** In-memory кэш barcode/GTIN → product для аптечной кассы (TTL). */

const DEFAULT_TTL_MS = 5 * 60 * 1000;

const entries = new Map();

function normalizeKey(storeId, barcode) {
  const code = String(barcode || '').trim().toLowerCase();
  if (!code || storeId == null) return null;
  return `${storeId}:${code}`;
}

export function getCachedPharmacyProduct(storeId, barcode) {
  const key = normalizeKey(storeId, barcode);
  if (!key) return null;
  const hit = entries.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    entries.delete(key);
    return null;
  }
  return hit.product;
}

export function setCachedPharmacyProduct(storeId, barcode, product, ttlMs = DEFAULT_TTL_MS) {
  const key = normalizeKey(storeId, barcode);
  if (!key || !product?.id) return;
  const entry = {
    product,
    expiresAt: Date.now() + (ttlMs || DEFAULT_TTL_MS),
  };
  entries.set(key, entry);
  for (const variant of barcodeLookupVariants(barcode)) {
    const variantKey = normalizeKey(storeId, variant);
    if (variantKey) entries.set(variantKey, entry);
  }
}

/** Прогреть кэш из уже загруженной страницы каталога. */
export function warmPharmacyBarcodeCache(storeId, products = []) {
  if (storeId == null || !Array.isArray(products)) return;
  for (const product of products) {
    if (!product?.id) continue;
    if (product.barcode) {
      setCachedPharmacyProduct(storeId, product.barcode, product);
    }
    if (Array.isArray(product.barcodes)) {
      product.barcodes.forEach((bc) => {
        if (bc) setCachedPharmacyProduct(storeId, bc, product);
      });
    }
    if (product.sku) {
      setCachedPharmacyProduct(storeId, product.sku, product);
    }
  }
}

export function clearPharmacyBarcodeCache() {
  entries.clear();
}

/** Только для тестов. */
export function pharmacyBarcodeCacheSize() {
  return entries.size;
}
