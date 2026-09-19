import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../../api/pharmacyStockMarks.api';
import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { isPharmacyMarkSoldLocally, rememberPharmacySoldMarks } from './pharmacySoldMarksStore';
import { resolvePharmacyProductByMarking } from './resolvePharmacyProductByMarking';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Резолв КМ на кассе:
 * 1) локальный sold-кэш
 * 2) свой склад stock_marks (быстро)
 * 3) товар по GTIN
 * 4) sale_sold_marks на бэке
 * 5) ASL — мягко (если включено)
 */
export async function resolveCashierMarkedProduct({
  products,
  rawCode,
  storeId,
  aslEnabled = false,
}) {
  const mark = preserveMarkingCodeForFiscal(rawCode);
  let product = null;
  let aslResult = null;
  let aslError = null;

  if (storeId && isPharmacyMarkSoldLocally(storeId, mark)) {
    return {
      status: 'sold',
      mark,
      product: null,
      aslResult: { found: true, alreadySold: true, status: 'SOLD_LOCAL' },
      aslError: null,
    };
  }

  if (storeId) {
    try {
      const { data } = await pharmacyStockMarksApi.check({ storeId, code: mark });
      if (data?.alreadySold) {
        rememberPharmacySoldMarks(storeId, [mark]);
        return {
          status: 'sold',
          mark,
          product: null,
          aslResult: { found: true, alreadySold: true, status: data.status || 'SOLD' },
          aslError: null,
        };
      }
      if (data?.found && data.productId) {
        product = await loadProductById(products, data.productId, storeId);
        if (product) {
          return {
            status: 'ok',
            mark,
            product: withMark(product, mark),
            aslResult: { found: true, status: data.status || 'IN_STOCK', source: 'stock_marks' },
            aslError: null,
          };
        }
      }
    } catch {
      // склад недоступен — fallback на каталог / ASL
    }
  }

  try {
    product = await resolvePharmacyProductByMarking({ products, rawCode: mark, storeId });
  } catch (error) {
    aslError = error;
  }

  if (storeId) {
    try {
      const { data } = await pharmacySalesApi.checkMarkSold({ storeId, code: mark });
      if (data?.sold === true) {
        rememberPharmacySoldMarks(storeId, [mark]);
        return {
          status: 'sold',
          mark,
          product,
          aslResult: { found: true, alreadySold: true, status: data.status || 'SOLD' },
          aslError: null,
        };
      }
    } catch {
      // сеть — дальше ASL / локальный каталог
    }
  }

  if (aslEnabled && storeId) {
    try {
      const { data } = await pharmacyIntegrationApi.verifyMarking({ storeId, code: mark });
      aslResult = data;
      if (isAslMarkAlreadySold(aslResult)) {
        rememberPharmacySoldMarks(storeId, [mark]);
        return { status: 'sold', mark, product, aslResult, aslError: null };
      }
      if (!product && aslResult?.gtin) {
        product = await resolvePharmacyProductByMarking({
          products,
          rawCode: mark,
          extraGtins: [aslResult.gtin],
          storeId,
        });
      }
    } catch (error) {
      aslError = aslError || error;
    }
  }

  if (product) {
    return {
      status: 'ok',
      mark,
      product: withMark(product, mark),
      aslResult,
      aslError: null,
    };
  }

  return { status: 'not-found', mark, product: null, aslResult, aslError };
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
