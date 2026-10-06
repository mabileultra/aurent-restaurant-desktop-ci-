package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsStoresResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    List<PlatformStoreRow> stores,
    List<PlatformStoreRank> topByTurnover,
    List<PlatformStoreRank> topByProfit
) {
    public record PlatformStoreRow(
        Integer storeId,
        String name,
        BigDecimal turnover,
        BigDecimal profit,
        long receipts,
        BigDecimal avgCheck,
        BigDecimal growthPct
    ) {}

    public record PlatformStoreRank(
        Integer storeId,
        String name,
        BigDecimal value
    ) {}
}
