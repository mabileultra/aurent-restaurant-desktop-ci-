package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.dto.BulkProductIdsRequest;
import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Каталог аптеки: только PHARMACY, без grocery API. */
public interface PharmacyProductService {

    PageResponse<ProductResponse> list(
        String search,
        boolean activeOnly,
        String scope,
        Integer storeId,
        Pageable pageable
    );

    ProductResponse get(UUID id, Integer storeId);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    ProductResponse create(CreateProductRequest req);

    ProductResponse update(UUID id, UpdateProductRequest req);

    void deactivate(UUID id);

    int bulkDeactivate(BulkProductIdsRequest req);

    int bulkUpdateTaxRate(BulkTaxRateRequest req);
}
