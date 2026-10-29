package com.pos.sales.dto.sync;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.product.ProductResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Incremental catalog sync for offline cashiers.
 * When {@code fullReset} is true, client must call {@code /sync/bootstrap}; product/category lists are empty.
 * Categories are always a full replace list when {@code fullReset} is false (no category updatedAt yet).
 */
public record CashierSyncCatalogDeltaResponse(
    Integer storeId,
    String storeName,
    Instant since,
    Instant syncedAt,
    boolean fullReset,
    List<CategoryResponse> categories,
    List<ProductResponse> products,
    List<UUID> removedProductIds
) {
    public static CashierSyncCatalogDeltaResponse fullReset(
        Integer storeId,
        String storeName,
        Instant since,
        Instant syncedAt
    ) {
        return new CashierSyncCatalogDeltaResponse(
            storeId,
            storeName,
            since,
            syncedAt,
            true,
            List.of(),
            List.of(),
            List.of()
        );
    }
}
