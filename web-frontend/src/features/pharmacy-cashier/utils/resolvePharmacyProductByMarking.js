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
  for (const barcode of candidates) {
    try {
      const { data } = await pharmacyWarehouseApi.getByBarcode(barcode, storeId);
      if (data?.id) return data;
    } catch (error) {
      if (!isMissingProduct(error)) throw error;
    }
  }
  return null;
}
