package com.pos.pharmacy.cache.impl;

import com.pos.pharmacy.cache.PharmacyProductBarcodeCache;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
@ConditionalOnProperty(prefix = "app.pharmacy.redis", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoOpPharmacyProductBarcodeCache implements PharmacyProductBarcodeCache {

    @Override
    public ProductResponse getOrLoad(
        Integer companyId,
        Integer storeId,
        String rawBarcode,
        Supplier<ProductResponse> loader
    ) {
        return loader.get();
    }

    @Override
    public void evictStore(Integer companyId, Integer storeId) {
        // no-op
    }

    @Override
    public void evictCompany(Integer companyId) {
        // no-op
    }
}
