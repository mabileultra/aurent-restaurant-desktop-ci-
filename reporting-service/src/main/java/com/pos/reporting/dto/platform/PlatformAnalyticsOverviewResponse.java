package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsOverviewResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    PlatformKpiBlock kpi,
    List<PlatformDailyPoint> daily,
    List<PlatformNamedMetric> topStores,
    List<PlatformProductQtyRow> topProductsQty,
    List<PlatformProductProfitRow> topProductsProfit,
    List<PlatformWeekdayRow> weekdays,
    List<PlatformPaymentShare> payments,
    List<PlatformAnomalyRow> anomalies
) {
    public record PlatformKpiBlock(
        PlatformKpiMetric turnover,
        PlatformKpiMetric profit,
        PlatformKpiMetric salesQty,
        PlatformKpiMetric receipts,
        PlatformKpiMetric avgCheck,
        PlatformKpiMetric returns,
        PlatformKpiMetric activeStores
    ) {}

    public record PlatformKpiMetric(BigDecimal value, BigDecimal deltaPct) {}

    public record PlatformDailyPoint(
        String date,
        String label,
        BigDecimal turnover,
        BigDecimal profit,
        long receipts,
        BigDecimal avgCheck,
        boolean best
    ) {}

    public record PlatformNamedMetric(String name, BigDecimal turnover, BigDecimal deltaPct) {}

    public record PlatformProductQtyRow(String name, long qty) {}

    public record PlatformProductProfitRow(String name, BigDecimal profit) {}

    public record PlatformWeekdayRow(String day, BigDecimal turnover, BigDecimal sharePct, boolean peak) {}

    public record PlatformPaymentShare(String id, BigDecimal amount, BigDecimal sharePct) {}

    public record PlatformAnomalyRow(String tone, String title, String detail, BigDecimal value) {}
}
