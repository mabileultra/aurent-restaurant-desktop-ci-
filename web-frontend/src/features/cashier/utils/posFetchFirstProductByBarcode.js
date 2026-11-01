import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { posBarcodeCandidates } from './posBarcodeCandidates';

/**
 * Первый найденный товар по вариантам EAN/GTIN — запросы параллельно.
 * Порядок кандидатов сохраняется (как в posBarcodeCandidates).
 */
export async function posFetchFirstProductByBarcode(storeId, raw, { catalogKind } = {}) {
  const candidates = posBarcodeCandidates(raw);
  if (!storeId || candidates.length === 0) return null;

  const settled = await Promise.all(
    candidates.map(async (code) => {
      try {
        const product = await posFetchProductByBarcode(storeId, code, { catalogKind });
        return product ? { product, code } : null;
      } catch {
        return null;
      }
    })
  );

  for (const hit of settled) {
    if (hit) return hit;
  }
  return null;
}
