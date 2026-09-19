import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import {
  isPharmacyMarkingCode,
  markingBarcodeCandidates,
} from '../../pharmacy-cashier/utils/pharmacyMarkingCode';
import { findProductByMarkingCode } from '../../pharmacy-cashier/utils/pharmacyMarkingProductMatch';
import { preserveMarkingCodeForFiscal } from '../../pharmacy-cashier/utils/preserveMarkingCodeForFiscal';
import { isAslMarkAlreadySold } from '../../pharmacy-cashier/utils/aslMarkingAlreadySold';

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
  let product = findProductByMarkingCode(products, mark);
  if (product) return product;

  for (const gtin of extraGtins) {
    product = findProductByMarkingCode(products, `01${gtin}`);
    if (product) return product;
  }

  if (!storeId) return null;

  const candidates = markingBarcodeCandidates(mark, extraGtins);
  for (const barcode of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const hit = await posFetchProductByBarcode(storeId, barcode);
      if (hit?.id) return hit;
    } catch {
      /* next */
    }
  }
  return null;
}

/**
 * Резолв КМ на обычной кассе:
 * 1) товар по GTIN из DataMatrix
 * 2) если ASL включён — мягкая проверка (уже продан → блок; сеть упала → не мешаем)
 * Обычный скан штрихкода сюда не попадает.
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

  let product = await findByGtinCandidates(products, mark, storeId);
  let aslResult = null;

  if (aslEnabled && storeId) {
    try {
      const { data } = await pharmacyIntegrationApi.verifyMarking({ storeId, code: mark });
      aslResult = data;
      if (isAslMarkAlreadySold(aslResult)) {
        return { status: 'sold', mark, product, aslResult };
      }
      if (!product && aslResult?.gtin) {
        product = await findByGtinCandidates(products, mark, storeId, [aslResult.gtin]);
      }
    } catch {
      // ASL недоступен — продажа по найденному GTIN не блокируется
    }
  }

  if (!product) {
    return { status: 'not-found', mark, product: null, aslResult };
  }

  return { status: 'ok', mark, product: withMark(product, mark), aslResult };
}
