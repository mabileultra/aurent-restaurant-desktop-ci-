package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.domain.StockMovementType;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.service.stock.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Inventory-owned stock adjust by product id (loads card via catalog loader).
 * Integrations must not inject {@code ProductRepository}.
 */
@Component
@RequiredArgsConstructor
public class ProductStockAdjuster {

    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final StoreStockService storeStockService;
    private final StockMovementPersistence stockMovementPersistence;

    public boolean applyForCompany(
        UUID productId,
        Integer companyId,
        Store store,
        BigDecimal quantity,
        String movementType,
        BigDecimal movementQuantity,
        UUID referenceId,
        User createdBy,
        String notes,
        String referenceNumber
    ) {
        Product product = catalogManagedProductLoader.requireById(productId);
        if (product.getCompany() != null && !companyId.equals(product.getCompany().getId())) {
            return false;
        }
        if (StockMovementType.SALE.equals(movementType) || StockMovementType.WRITE_OFF.equals(movementType)) {
            storeStockService.decrease(product, store, quantity);
        } else {
            storeStockService.increase(product, store, quantity);
        }
        stockMovementPersistence.save(StockLineCatalogSnapshot.apply(StockMovement.builder(), product)
            
            .store(store)
            .movementType(movementType)
            .quantity(movementQuantity)
            .referenceId(referenceId)
            .createdBy(createdBy)
            .notes(notes)
            .build(), referenceNumber);
        return true;
    }
}
