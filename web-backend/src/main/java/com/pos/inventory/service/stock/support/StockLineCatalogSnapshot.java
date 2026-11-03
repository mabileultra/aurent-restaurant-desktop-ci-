package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockMovement;

import java.util.UUID;

/**
 * Freezes catalog identity onto stock document lines / movements (Waves 2.3–2.4).
 * Live JPA Product association is removed; DB FK on product_id remains until Wave 2.5.
 */
public final class StockLineCatalogSnapshot {

    private StockLineCatalogSnapshot() {
    }

    public record Card(UUID productId, String productName, String productSku, String productBarcode) {
        public static Card of(Product product) {
            if (product == null || product.getId() == null) {
                throw new IllegalArgumentException("Product is required for stock line snapshot");
            }
            String barcode = product.getBarcode();
            if (barcode != null && barcode.isBlank()) {
                barcode = null;
            } else if (barcode != null) {
                barcode = barcode.trim();
            }
            return new Card(
                product.getId(),
                product.getName() != null ? product.getName() : "",
                product.getSku() != null ? product.getSku() : "",
                barcode
            );
        }
    }

    public static StockMovement.StockMovementBuilder apply(StockMovement.StockMovementBuilder builder, Product product) {
        Card card = Card.of(product);
        return builder
            .productId(card.productId())
            .productName(card.productName())
            .productSku(card.productSku())
            .productBarcode(card.productBarcode());
    }
}
