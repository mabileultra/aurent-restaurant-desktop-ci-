package com.pos.dto.store;

public record StoreStatsResponse(
    long totalStores,
    long activeStores,
    long inactiveStores,
    long companiesCount
) {
}
