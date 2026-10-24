import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { resolveCashierMarking } from '../../marking/resolveCashierMarking';
import { resolvePharmacyProductByMarking } from './resolvePharmacyProductByMarking';

/**
 * Резолв КМ на кассе аптеки — та же схема, что grocery:
 * sold-gate, потом GTIN. Склад IN_STOCK только подсказывает карточку.
 */
export async function resolveCashierMarkedProduct({
  products,
  rawCode,
  storeId,
  cashRegisterId = null,
  aslEnabled = false,
}) {
  return resolveCashierMarking({
    rawCode,
    storeId,
    cashRegisterId,
    aslEnabled,
    findProduct: async (mark, gate) => {
      const stock = gate?.stock;
      if (stock?.found && stock.productId && !stock.alreadySold) {
        const fromStock = await loadProductById(products, stock.productId, storeId);
        if (fromStock) return fromStock;
      }
      try {
        return await resolvePharmacyProductByMarking({ products, rawCode: mark, storeId });
      } catch {
        return null;
      }
    },
  });
}

async function loadProductById(products, productId, storeId) {
  const id = String(productId);
  const local = (products || []).find((p) => String(p?.id) === id);
  if (local) return local;
  try {
    const { data } = await pharmacyWarehouseApi.getProduct(productId, { storeId });
    return data?.id ? data : null;
  } catch {
    return null;
  }
}
