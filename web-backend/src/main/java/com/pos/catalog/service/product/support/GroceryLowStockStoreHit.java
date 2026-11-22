package com.pos.catalog.service.product.support;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** One low-stock hit for a product at a specific store ({@code store_stock}). */
public record GroceryLowStockStoreHit(
    UUID productId,
    Integer storeId,
    String storeName,
    BigDecimal quantity,
    Instant updatedAt
) {
}
