import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { inspectMarkPunched } from './inspectMarkPunched';
import { resolvePharmacyProductByMarking } from './resolvePharmacyProductByMarking';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Резолв КМ на кассе аптеки.
 * Сначала жёстко: код уже пробит (кэш / склад / журнал продаж / ASL) — в чек не кладём.
 * Карточку ищем только после этой проверки.
 */
export async function resolveCashierMarkedProduct({
  products,
  rawCode,
  storeId,
  aslEnabled = false,
}) {
  const mark = preserveMarkingCodeForFiscal(rawCode);
  const gate = await inspectMarkPunched({ storeId, mark, aslEnabled });
  if (gate.punched) {
    return {
      status: 'sold',
      mark,
      product: null,
      aslResult: gate.aslResult,
      aslError: null,
    };
  }

  let product = null;
  let aslError = gate.aslError;
  const stock = gate.stock;
  if (stock?.found && stock.productId) {
    product = await loadProductById(products, stock.productId, storeId);
    if (product) {
      return {
        status: 'ok',
        mark,
        product: withMark(product, mark),
        aslResult: gate.aslResult || { found: true, status: stock.status || 'IN_STOCK', source: 'stock_marks' },
        aslError: null,
      };
    }
  }

  try {
    product = await resolvePharmacyProductByMarking({ products, rawCode: mark, storeId });
  } catch (error) {
    aslError = aslError || error;
  }

  if (!product && gate.aslResult?.gtin) {
    try {
      product = await resolvePharmacyProductByMarking({
        products,
        rawCode: mark,
        extraGtins: [gate.aslResult.gtin],
        storeId,
      });
    } catch (error) {
      aslError = aslError || error;
    }
  }

  if (product) {
    return {
      status: 'ok',
      mark,
      product: withMark(product, mark),
      aslResult: gate.aslResult,
      aslError: null,
    };
  }

  return { status: 'not-found', mark, product: null, aslResult: gate.aslResult, aslError };
}

function withMark(product, mark) {
  return {
    ...product,
    productMark: mark,
    markCode: mark,
    markedProduct: true,
  };
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
