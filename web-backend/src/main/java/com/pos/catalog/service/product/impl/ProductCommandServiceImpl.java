package com.pos.catalog.service.product.impl;

import com.pos.catalog.dto.product.BulkTaxRateRequest;
import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.product.UpdateProductRequest;
import com.pos.catalog.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.ProductCommandService;
import com.pos.catalog.service.product.support.CatalogPrimaryProductWriteSupport;
import com.pos.catalog.service.product.support.InactiveBarcodeReleaser;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductSnapshotNotifier;
import com.pos.catalog.service.product.support.ProductStoreAssortmentSupport;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.shared.log.LogUtil;
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
    private final CatalogPrimaryProductWriteSupport catalogPrimaryWrite;
    private final InactiveBarcodeReleaser barcodeReleaser;
    private final CatalogIsolationSupport catalogIsolation;
    private final ProductStoreAssortmentSupport assortmentSupport;

    @Override
    public ProductResponse createProduct(CreateProductRequest req) {
        catalogIsolation.rejectPharmacyCodeOnGroceryWrite(req != null ? req.businessTypeCode() : null);
        return createHandler.create(req);
    }

    @Override
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        return updateProduct(id, req, null);
    }

    @Override
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req, Integer storeId) {
        Product product = catalogLoader.requireById(id);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        catalogIsolation.rejectPharmacyCodeOnGroceryWrite(req != null ? req.businessTypeCode() : null);
        return updateHandler.update(id, req, storeId);
    }

    @Override
    public void deactivateProduct(UUID id) {
        deactivateProduct(id, null);
    }

    @Override
    public void deactivateProduct(UUID id, Integer storeId) {
        if (storeId != null) {
            Product product = catalogLoader.requireDetailed(id);
            catalogIsolation.rejectPharmacyFromGroceryWrite(product);
            assortmentSupport.removeFromStore(product, storeId);
            productRepository.save(product);
            productSnapshotNotifier.notify(product.getId());
            LogUtil.info(
                ProductCommandServiceImpl.class,
                "Product removed from store assortment: id={} storeId={}",
                id,
                storeId
            );
            return;
        }
        Product product = catalogLoader.requireById(id);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        catalogPrimaryWrite.deactivateBeforeLocalSave(id);
        product.setActive(false);
        barcodeReleaser.release(product);
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
        return bulkDeactivateProducts(productIds, null);
    }

    @Override
    public int bulkDeactivateProducts(List<UUID> productIds, Integer storeId) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) {
            throw PosExceptions.badRequest("No products found for provided ids");
        }
        products.forEach(catalogIsolation::rejectPharmacyFromGroceryWrite);
        if (storeId != null) {
            int updated = 0;
            for (UUID productId : productIds) {
                Product detailed = catalogLoader.requireDetailed(productId);
                catalogIsolation.rejectPharmacyFromGroceryWrite(detailed);
                assortmentSupport.removeFromStore(detailed, storeId);
                productRepository.save(detailed);
                productSnapshotNotifier.notify(detailed.getId());
                updated++;
            }
            return updated;
        }
        int updated = 0;
        for (Product product : products) {
            if (product.isActive()) {
                catalogPrimaryWrite.deactivateBeforeLocalSave(product.getId());
                product.setActive(false);
                barcodeReleaser.release(product);
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
            catalogPrimaryWrite.upsertBeforeLocalSave(product);
        }
        productRepository.saveAll(products);
        products.forEach(product -> productSnapshotNotifier.notify(product.getId()));
        return products.size();
    }
}
