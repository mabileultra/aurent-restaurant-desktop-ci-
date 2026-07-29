package com.pos.catalog.service.product;

import com.pos.catalog.dto.product.BulkTaxRateRequest;
import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.product.UpdateProductRequest;

import java.util.List;
import java.util.UUID;

public interface ProductCommandService {

    ProductResponse createProduct(CreateProductRequest req);

    ProductResponse updateProduct(UUID id, UpdateProductRequest req);

    void deactivateProduct(UUID id);

    int bulkUpdateTaxRate(BulkTaxRateRequest req);

    int bulkDeactivateProducts(List<UUID> productIds);
}
