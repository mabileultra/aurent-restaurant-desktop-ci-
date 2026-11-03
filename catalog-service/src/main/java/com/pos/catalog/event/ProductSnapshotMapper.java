package com.pos.catalog.event;

import com.pos.catalog.entity.Product;
import com.pos.shared.event.ProductSnapshotEvent;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Maps catalog-service {@link Product} → shared {@link ProductSnapshotEvent}.
 * categoryId stays null until shared event evolves past Integer (web-backend legacy).
 */
@Component
public class ProductSnapshotMapper {

    public ProductSnapshotEvent toEvent(Product product) {
        if (product == null || product.getId() == null) {
            return null;
        }
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        Instant updatedAt = product.getUpdatedAt() != null ? product.getUpdatedAt() : Instant.now();
        return new ProductSnapshotEvent(
            product.getId(),
            product.getCompanyId(),
            product.getSku(),
            product.getName(),
            product.getBarcode(),
            null,
            categoryName,
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getLowStockAlert(),
            product.isActive(),
            updatedAt
        );
    }
}
