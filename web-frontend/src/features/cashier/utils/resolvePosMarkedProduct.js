import { posFetchProductByBarcode, posFetchProductsPage } from '../../../services/pos/posDataRouter';
import { isPharmacyMarkingCode } from '../../pharmacy-cashier/utils/pharmacyMarkingCode';
import { lookupProductByMarkingGtin } from '../../pharmacy-cashier/utils/lookupProductByMarkingGtin';
import { preserveMarkingCodeForFiscal } from '../../pharmacy-cashier/utils/preserveMarkingCodeForFiscal';
import { inspectMarkPunched } from '../../pharmacy-cashier/utils/inspectMarkPunched';

function withMark(product, mark) {
  return {
    ...product,
    productMark: mark,
    markCode: mark,
    markedProduct: true,
    productMarks: [mark],
  };
}

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
  aslEnabled = false,
}) {
  const mark = preserveMarkingCodeForFiscal(rawCode);
  if (!mark || !isPharmacyMarkingCode(rawCode)) {
    return { status: 'not-marking', mark: '', product: null, aslResult: null };
  }

  const gate = await inspectMarkPunched({ storeId, mark, aslEnabled });
  if (gate.punched) {
    return { status: 'sold', mark, product: null, aslResult: gate.aslResult };
  }

  const product = await findByGtinCandidates(products, mark, storeId);
  if (!product) {
    return { status: 'not-found', mark, product: null, aslResult: gate.aslResult };
  }

  return { status: 'ok', mark, product: withMark(product, mark), aslResult: gate.aslResult };
}
