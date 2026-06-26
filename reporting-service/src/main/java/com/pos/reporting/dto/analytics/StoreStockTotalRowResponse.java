package com.pos.reporting.dto.analytics;

import java.util.UUID;

public record StoreStockTotalRowResponse(
    Integer storeId,
    String storeName,
    long stockQty
) {
}
