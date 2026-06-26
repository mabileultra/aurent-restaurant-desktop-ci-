package com.pos.reporting.dto;

import java.math.BigDecimal;

public record DailySummaryResponse(
    BigDecimal totalRevenue,
    long transactionCount,
    long itemsSold,
    BigDecimal totalCostEstimate,
    BigDecimal grossProfit
) {}
