import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { resolvePharmacyProductByMarking } from './resolvePharmacyProductByMarking';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Та же логика, что в модалке «Проверка маркировки»:
 * 1) товар по GTIN из КМ в каталоге / API склада
 * 2) ASL только для «уже продан» и доп. GTIN (если ключ настроен)
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

  try {
    product = await resolvePharmacyProductByMarking({ products, rawCode: mark, storeId });
  } catch (error) {
    aslError = error.response?.data?.message ?? error.message;
  }

  if (aslEnabled && storeId) {
    try {
      const { data } = await pharmacyIntegrationApi.verifyMarking({ storeId, code: mark });
      aslResult = data;
      if (isAslMarkAlreadySold(aslResult)) {
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
