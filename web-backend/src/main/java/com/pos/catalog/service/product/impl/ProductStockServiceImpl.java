package com.pos.catalog.service.product.impl;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.inventory.dto.warehouse.WarehouseReceiveRequest;
import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductRepository;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.catalog.service.product.ProductExtensionService;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.ProductStockService;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductSnapshotNotifier;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductStockServiceImpl implements ProductStockService {

    private final ProductCatalogLoader catalogLoader;
    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final StoreStockService storeStockService;
    private final ProductResponseAssembler assembler;
    private final ProductExtensionService extensionService;
    private final ProductSnapshotNotifier productSnapshotNotifier;
    private final CatalogIsolationSupport catalogIsolation;

    @Override
    public ProductResponse adjustStock(UUID id, BigDecimal quantity, String movementType, String notes, Integer storeId) {
        Product product = catalogLoader.requireById(id);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        Store store = storeStockService.resolveStoreForProduct(product, storeId);
        BigDecimal delta = QuantityUtil.normalize(quantity);
        applyStockDelta(product, delta, store);
        productRepository.save(product);
        recordMovement(product, delta, movementType, notes, store);
        ProductResponse base = assembler.toResponse(product);
        return assembler.withStockQuantity(base, storeStockService.getQuantity(product.getId(), store.getId()));
    }

    @Override
    public ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req) {
        Product product = catalogLoader.requireDetailed(req.productId());
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        BigDecimal quantity = QuantityUtil.normalize(req.quantity());
        if (quantity.signum() <= 0) {
            throw PosExceptions.badRequest("Quantity must be greater than zero");
        }
        Store store = storeStockService.resolveStoreForProduct(product, req.storeId());
        applyStockDelta(product, quantity, store);
        product.setSellingPrice(req.unitSellingPrice());
        product.setCostPrice(req.purchasePrice());
        if (req.vatPercent() != null) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(BigDecimal.valueOf(req.vatPercent())));
        }
        extensionService.applyRetailFlags(product, null, req.markedProduct());
        if (StringUtils.hasText(req.storageLocation())) {
            product.setStorageLocation(req.storageLocation().trim());
        }
        Product saved = productRepository.save(product);
        recordMovement(saved, quantity, "RESTOCK", "Склад: поступление", store);
        productSnapshotNotifier.notify(saved.getId());
        return assembler.toResponse(saved);
    }

    private void applyStockDelta(Product product, BigDecimal delta, Store store) {
        if (delta.signum() == 0) {
            throw PosExceptions.badRequest("Quantity must be non-zero");
        }
        if (delta.signum() > 0) {
            storeStockService.increase(product, store, delta);
        } else {
            storeStockService.decrease(product, store, delta.negate());
        }
    }

    private void recordMovement(Product product, BigDecimal quantity, String movementType, String notes, Store store) {
        stockMovementPersistence.save(StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(movementType)
            .quantity(QuantityUtil.normalize(quantity))
            .notes(notes)
            .build());
    }
}
