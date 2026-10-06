package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsProductsResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    PlatformProductKpi kpi,
    List<PlatformProductRow> products,
    List<PlatformProductRank> topByQty,
    List<PlatformProductRank> topByProfit,
    List<PlatformProductRank> rising,
    List<PlatformProductRank> falling,
    List<PlatformCategoryRow> categories
) {
    public record PlatformProductKpi(
        long soldQty,
        BigDecimal revenue,
        BigDecimal cost,
        BigDecimal profit,
        BigDecimal marginPct
    ) {}

    public record PlatformProductRow(
        String name,
        long qty,
        BigDecimal revenue,
        BigDecimal cost,
        BigDecimal profit,
        BigDecimal marginPct,
        BigDecimal growthPct
    ) {}

    public record PlatformProductRank(
        String name,
        BigDecimal value
    ) {}

    public record PlatformCategoryRow(
        String name,
        long qty,
        BigDecimal revenue,
        BigDecimal profit
    ) {}
}
