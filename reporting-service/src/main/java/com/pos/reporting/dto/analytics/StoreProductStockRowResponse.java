package com.pos.reporting.dto.analytics;

import java.util.UUID;

public record StoreProductStockRowResponse(
    UUID productId,
    Integer storeId,
    String storeName,
    String productName,
    int stockQty
) {
}
