import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { lookupProductByMarkingGtin } from '../../marking';
import {
  getCachedPharmacyProduct,
  setCachedPharmacyProduct,
} from './pharmacyBarcodeProductCache';

function isMissingProduct(error) {
  const status = error?.response?.status;
  return status === 404 || status === 400;
}

/** Найти товар кассы по КМ: сначала GTIN, ИКПУ из Tasnif — только запасной путь. */
export async function resolvePharmacyProductByMarking({
  products,
  rawCode,
  extraGtins = [],
  storeId,
}) {
  return lookupProductByMarkingGtin({
    products,
    mark: rawCode,
    extraGtins,
    fetchByBarcode: storeId
      ? async (barcode) => {
        const cached = getCachedPharmacyProduct(storeId, barcode);
        if (cached) return cached;
        try {
          const { data } = await pharmacyWarehouseApi.getByBarcode(barcode, storeId);
          if (data?.id) {
            setCachedPharmacyProduct(storeId, barcode, data);
            return data;
          }
          return null;
        } catch (error) {
          if (!isMissingProduct(error)) throw error;
          return null;
        }
      }
      : undefined,
    searchCatalog: storeId
      ? async (query) => {
        const { data } = await pharmacyWarehouseApi.listProducts({
          storeId,
          search: query,
          page: 0,
          size: 20,
          activeOnly: true,
          scope: 'ACTIVE',
        });
        return data;
      }
      : undefined,
  });
}
