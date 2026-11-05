import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { posBarcodeCandidates } from './posBarcodeCandidates';
import { getPosBarcodeHit, rememberPosBarcodeHit } from './posBarcodeHitCache';

/**
 * Первый найденный товар по вариантам EAN/GTIN.
 * Кандидаты параллельно; возвращаем как только готов лучший по порядку (не ждём хвост).
 */
export async function posFetchFirstProductByBarcode(storeId, raw, { catalogKind } = {}) {
  const candidates = posBarcodeCandidates(raw);
  if (!storeId || candidates.length === 0) return null;

  for (const code of candidates) {
    const cached = getPosBarcodeHit(storeId, code);
    if (cached) return { product: cached, code };
  }

  const results = new Array(candidates.length).fill(undefined);
  let next = 0;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (value?.product) {
        rememberPosBarcodeHit(storeId, candidates, value.product);
      }
      resolve(value);
    };

    const drain = () => {
      while (next < results.length && results[next] !== undefined) {
        const hit = results[next];
        if (hit) {
          finish(hit);
          return;
        }
        next += 1;
      }
      if (next >= results.length) finish(null);
    };

    candidates.forEach((code, index) => {
      void (async () => {
        try {
          const product = await posFetchProductByBarcode(storeId, code, { catalogKind });
          results[index] = product ? { product, code } : null;
        } catch {
          results[index] = null;
        }
        drain();
      })();
    });
  });
}
