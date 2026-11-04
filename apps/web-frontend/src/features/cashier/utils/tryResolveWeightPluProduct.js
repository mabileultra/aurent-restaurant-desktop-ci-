import { scalesApi } from '../../../api/scales.api';
import { decodeWeightBarcode } from '../../scales/utils/weightBarcode';

/**
 * Весовой PLU только при валидной этикетке 20….
 * Ошибка/таймаут → null, обычный штрихкод идёт параллельно.
 */
export async function tryResolveWeightPluProduct(raw, storeId, { timeoutMs = 450 } = {}) {
  const decoded = decodeWeightBarcode(raw);
  if (!decoded || !storeId) return null;

  try {
    const { data: product } = await Promise.race([
      scalesApi.getByPlu(decoded.plu, storeId),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('weight-plu-timeout')), timeoutMs);
      }),
    ]);
    if (!product) return null;
    return { product, weightKg: decoded.weightKg, plu: decoded.plu };
  } catch {
    return null;
  }
}
