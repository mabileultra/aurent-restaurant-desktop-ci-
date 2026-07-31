package com.pos.ai.dto.report.analytics;

import java.util.UUID;

public record SoldUnitsByStoreProductRowResponse(
    UUID productId,
    Integer storeId,
    String productName,
    long soldUnits
) {
}
