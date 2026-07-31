package com.pos.ai.dto.report;

import java.math.BigDecimal;

public record DailySummaryResponse(
    BigDecimal totalRevenue,
    long transactionCount,
    long itemsSold,
    BigDecimal totalCostEstimate,
    BigDecimal grossProfit
) {}
