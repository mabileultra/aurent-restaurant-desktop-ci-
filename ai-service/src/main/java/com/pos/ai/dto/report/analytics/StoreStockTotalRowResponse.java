package com.pos.ai.dto.report.analytics;

public record StoreStockTotalRowResponse(
    Integer storeId,
    String storeName,
    long stockQty
) {
}
