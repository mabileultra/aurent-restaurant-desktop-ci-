import { posFetchProductByBarcode, posFetchProductsPage } from '../../../services/pos/posDataRouter';
import { lookupProductByMarkingGtin } from '../../marking';
import { resolveCashierMarking } from '../../marking/resolveCashierMarking';

async function findByGtinCandidates(products, mark, storeId, extraGtins = []) {
  if (!storeId && (!products || products.length === 0)) return null;
  return lookupProductByMarkingGtin({
    products,
    mark,
    extraGtins,
    fetchByBarcode: storeId
      ? async (barcode) => {
        try {
          return await posFetchProductByBarcode(storeId, barcode);
        } catch {
          return null;
        }
      }
      : undefined,
    searchCatalog: storeId
      ? (query) => posFetchProductsPage({ storeId, search: query, pageParam: 0 })
      : undefined,
  });
}

/**
 * Резолв КМ на обычной кассе.
 * Сначала жёстко: код уже пробит — в чек нельзя. Штрихкод сюда не попадает.
 * Сеть ASL упала — не блокируем, если свой журнал продаж код не нашёл.
 */
export async function resolvePosMarkedProduct({
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
    findProduct: (mark) => findByGtinCandidates(products, mark, storeId),
  });
}
