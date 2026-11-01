import { findProductBarcode, findProductByIkpu, withScannedBarcode } from './productBarcodeMatch';
import { posBarcodeCandidates } from './posBarcodeCandidates';

/**
 * Sync hit from already-loaded POS list (no network).
 * @returns {{ product: object, code: string } | null}
 */
export function resolveBarcodeFromLoadedProducts(products, raw) {
  const list = Array.isArray(products) ? products : [];
  if (list.length === 0) return null;
  const candidates = posBarcodeCandidates(raw);
  if (candidates.length === 0) return null;

  for (const code of candidates) {
    const byBarcode = list.find((p) => findProductBarcode(p, code));
    if (byBarcode) {
      return { product: withScannedBarcode(byBarcode, code), code };
    }
    const byIkpu = list.find((p) => findProductByIkpu(p, code));
    if (byIkpu) {
      return { product: byIkpu, code };
    }
  }
  return null;
}
