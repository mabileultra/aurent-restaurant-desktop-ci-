import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { isPharmacyMarkSoldLocally, rememberPharmacySoldMarks } from './pharmacySoldMarksStore';
import { resolvePharmacyProductByMarking } from './resolvePharmacyProductByMarking';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Та же логика, что в модалке «Проверка маркировки»:
 * 1) локально уже продавали на кассе
 * 2) товар по GTIN из КМ
 * 3) наш backend: КМ уже в продажах магазина
 * 4) ASL — мягко (если ключ настроен)
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

  try {
    product = await resolvePharmacyProductByMarking({ products, rawCode: mark, storeId });
  } catch (error) {
    aslError = error.response?.data?.message ?? error.message;
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
      aslError = aslError || (error.response?.data?.message ?? error.message);
    }
  }

  if (product) {
    return {
      status: 'ok',
      mark,
      product: {
        ...product,
        productMark: mark,
        markCode: mark,
        markedProduct: true,
      },
      aslResult,
      aslError: null,
    };
  }

  return { status: 'not-found', mark, product: null, aslResult, aslError };
}
