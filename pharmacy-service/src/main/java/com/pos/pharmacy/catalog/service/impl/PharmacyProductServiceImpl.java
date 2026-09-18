package com.pos.pharmacy.catalog.service.impl;

import com.pos.pharmacy.catalog.dto.BulkProductIdsRequest;
import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.catalog.support.ProductListScope;
import com.pos.pharmacy.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyProductServiceImpl implements PharmacyProductService {

    private final ProductCatalogService catalogService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(
        String search,
        boolean activeOnly,
        String scope,
        Integer storeId,
        Pageable pageable
    ) {
        Boolean active = ProductListScope.activeFilter(scope, activeOnly);
        return catalogService.list(search, active, storeId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse get(UUID id, Integer storeId) {
        return catalogService.get(id, storeId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        return catalogService.getByBarcode(barcode, storeId);
    }

    @Override
    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        return catalogService.create(req);
    }

    @Override
    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        return catalogService.update(id, req);
    }

    @Override
    @Transactional
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        return catalogService.bulkUpdateTaxRate(req);
    }

    @Override
    @Transactional
    public void deactivate(UUID id) {
        catalogService.deactivate(id);
    }

    @Override
    @Transactional
    public int bulkDeactivate(BulkProductIdsRequest req) {
        return catalogService.bulkDeactivate(req);
    }
}
