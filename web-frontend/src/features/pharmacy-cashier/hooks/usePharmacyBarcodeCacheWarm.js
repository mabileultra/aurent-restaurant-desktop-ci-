import { useEffect } from 'react';
import { warmPharmacyBarcodeCache } from '../utils/pharmacyBarcodeProductCache';

/** Прогрев barcode→product из загруженных страниц каталога. */
export function usePharmacyBarcodeCacheWarm(storeId, products) {
  useEffect(() => {
    if (!storeId || !products?.length) return;
    warmPharmacyBarcodeCache(storeId, products);
  }, [storeId, products]);
}
