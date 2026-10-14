import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import {
  isPharmacyMarkingCode,
  markingBarcodeCandidates,
} from '../../pharmacy-cashier/utils/pharmacyMarkingCode';
import { findProductByMarkingCode } from '../../pharmacy-cashier/utils/pharmacyMarkingProductMatch';
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

  const extraGtins = gate.aslResult?.gtin ? [gate.aslResult.gtin] : [];
  const product = await findByGtinCandidates(products, mark, storeId, extraGtins);
  if (!product) {
    return { status: 'not-found', mark, product: null, aslResult: gate.aslResult };
  }

  return { status: 'ok', mark, product: withMark(product, mark), aslResult: gate.aslResult };
}
