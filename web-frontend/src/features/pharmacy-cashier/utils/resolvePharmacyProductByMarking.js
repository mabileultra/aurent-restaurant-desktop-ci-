import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { markingBarcodeCandidates } from './pharmacyMarkingCode';
import { findProductByMarkingCode } from './pharmacyMarkingProductMatch';

function isMissingProduct(error) {
  const status = error?.response?.status;
  return status === 404 || status === 400;
}

/** Найти товар кассы по DataMatrix: сначала GTIN в загруженном списке, затем в каталоге. */
export async function resolvePharmacyProductByMarking({
  products,
  rawCode,
  extraGtins = [],
  storeId,
}) {
  const local = findProductByMarkingCode(products, rawCode)
    || extraGtins
      .map((gtin) => findProductByMarkingCode(products, `01${gtin}`))
      .find(Boolean);
  if (local) return local;
  if (!storeId) return null;

  const candidates = markingBarcodeCandidates(rawCode, extraGtins);
  const found = await Promise.all(candidates.map(async (barcode) => {
    try {
      const { data } = await pharmacyWarehouseApi.getByBarcode(barcode, storeId);
      return data?.id ? data : null;
    } catch (error) {
      if (!isMissingProduct(error)) throw error;
      return null;
    }
  }));
  return found.find(Boolean) ?? null;
}
