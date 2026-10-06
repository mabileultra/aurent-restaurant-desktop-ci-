package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsSalesResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    PlatformSalesKpi kpi,
    List<PlatformSalesDailyPoint> daily,
    List<PlatformSalesWeekday> weekdays,
    List<PlatformSalesHour> hourly,
    boolean hourlyApproximate,
    PlatformSalesPeak peakDay,
    PlatformSalesPeak peakHour
) {
    public record PlatformSalesKpi(
        BigDecimal turnover,
        BigDecimal profit,
        long receipts,
        BigDecimal avgCheck,
        BigDecimal turnoverDeltaPct,
        BigDecimal profitDeltaPct,
        BigDecimal receiptsDeltaPct,
        BigDecimal avgCheckDeltaPct
    ) {}

    public record PlatformSalesDailyPoint(
        String date,
        String label,
        BigDecimal turnover,
        BigDecimal profit,
        long receipts,
        BigDecimal avgCheck,
        boolean best
    ) {}

    public record PlatformSalesWeekday(
        String day,
        BigDecimal turnover,
        BigDecimal sharePct,
        boolean peak
    ) {}

    public record PlatformSalesHour(
        String hour,
        BigDecimal turnover,
        long receipts,
        BigDecimal sharePct
    ) {}

    public record PlatformSalesPeak(
        String label,
        BigDecimal turnover,
        BigDecimal sharePct
    ) {}
}
