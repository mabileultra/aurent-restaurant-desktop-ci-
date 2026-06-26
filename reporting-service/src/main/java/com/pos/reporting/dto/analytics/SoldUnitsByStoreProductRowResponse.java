package com.pos.reporting.dto.analytics;

import java.util.UUID;

public record SoldUnitsByStoreProductRowResponse(
    UUID productId,
    Integer storeId,
    String productName,
    long soldUnits
) {
}
