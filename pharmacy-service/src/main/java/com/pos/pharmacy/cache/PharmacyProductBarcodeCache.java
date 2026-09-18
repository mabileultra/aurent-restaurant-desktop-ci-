package com.pos.pharmacy.cache;

import com.pos.pharmacy.catalog.dto.ProductResponse;

import java.util.function.Supplier;

/**
 * Кэш barcode → ProductResponse для кассы.
 * Ошибка Redis никогда не должна ронять запрос — только fallback в loader.
 */
public interface PharmacyProductBarcodeCache {

    ProductResponse getOrLoad(
        Integer companyId,
        Integer storeId,
        String rawBarcode,
        Supplier<ProductResponse> loader
    );

    void evictStore(Integer companyId, Integer storeId);

    void evictCompany(Integer companyId);
}
