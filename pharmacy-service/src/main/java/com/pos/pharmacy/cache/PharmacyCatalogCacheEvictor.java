package com.pos.pharmacy.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Точка инвалидации кэша каталога кассы после изменений остатка/товара.
 */
@Component
@RequiredArgsConstructor
public class PharmacyCatalogCacheEvictor {

    private final PharmacyProductBarcodeCache barcodeCache;

    public void onStoreStockChanged(Integer companyId, Integer storeId) {
        barcodeCache.evictStore(companyId, storeId);
    }

    public void onProductChanged(Integer companyId) {
        barcodeCache.evictCompany(companyId);
    }
}
