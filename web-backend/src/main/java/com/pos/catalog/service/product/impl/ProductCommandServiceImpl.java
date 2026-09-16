package com.pos.catalog.service.product.impl;

import com.pos.catalog.dto.product.BulkTaxRateRequest;
import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.product.UpdateProductRequest;
import com.pos.catalog.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.ProductCommandService;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductSnapshotNotifier;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.ProductValueNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductCommandServiceImpl implements ProductCommandService {

    private final ProductCreateHandler createHandler;
    private final ProductUpdateHandler updateHandler;
    private final ProductCatalogLoader catalogLoader;
    private final ProductRepository productRepository;
    private final ProductSnapshotNotifier productSnapshotNotifier;
    private final CatalogIsolationSupport catalogIsolation;

    @Override
    public ProductResponse createProduct(CreateProductRequest req) {
        catalogIsolation.rejectPharmacyCodeOnGroceryWrite(req != null ? req.businessTypeCode() : null);
        return createHandler.create(req);
    }

    @Override
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        Product product = catalogLoader.requireById(id);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        catalogIsolation.rejectPharmacyCodeOnGroceryWrite(req != null ? req.businessTypeCode() : null);
        return updateHandler.update(id, req);
    }

    @Override
    public void deactivateProduct(UUID id) {
        Product product = catalogLoader.requireById(id);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        product.setActive(false);
        productRepository.save(product);
        productSnapshotNotifier.notify(product.getId());
    }

    @Override
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        List<Product> products = productRepository.findAllById(req.productIds());
        if (products.isEmpty()) {
            throw PosExceptions.badRequest("No products found for provided ids");
        }
        products.forEach(catalogIsolation::rejectPharmacyFromGroceryWrite);
        return applyTaxRate(products, req.taxRate());
    }

    @Override
    public int bulkDeactivateProducts(List<UUID> productIds) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) {
            throw PosExceptions.badRequest("No products found for provided ids");
        }
        products.forEach(catalogIsolation::rejectPharmacyFromGroceryWrite);
        int updated = 0;
        for (Product product : products) {
            if (product.isActive()) {
                product.setActive(false);
                updated++;
            }
        }
        productRepository.saveAll(products);
        products.forEach(product -> productSnapshotNotifier.notify(product.getId()));
        return updated;
    }

    private int applyTaxRate(List<Product> products, java.math.BigDecimal taxRate) {
        for (Product product : products) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(taxRate));
        }
        productRepository.saveAll(products);
        products.forEach(product -> productSnapshotNotifier.notify(product.getId()));
        return products.size();
    }
}
