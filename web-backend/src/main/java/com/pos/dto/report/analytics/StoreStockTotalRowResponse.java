package com.pos.dto.report.analytics;

public record StoreStockTotalRowResponse(
    Integer storeId,
    String storeName,
    long stockQty
) {
}
