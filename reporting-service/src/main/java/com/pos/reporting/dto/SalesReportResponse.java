package com.pos.reporting.dto;

import java.math.BigDecimal;
import java.util.List;

public record SalesReportResponse(
    BigDecimal totalRevenue,
    long transactionCount,
    long totalItemsSold,
    BigDecimal averageTransactionValue,
    BigDecimal totalCostEstimate,
    BigDecimal grossProfit,
    List<DailyPoint> dailyBreakdown
) {}
