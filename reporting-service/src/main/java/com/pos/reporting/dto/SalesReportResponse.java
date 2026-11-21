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
    /** Сумма наличных по чекам периода (sale_facts.cash_amount). */
    BigDecimal cashTotal,
    /** Сумма безнала / карты (sale_facts.card_amount, вкл. Humo/Uzcard). */
    BigDecimal cardTotal,
    List<DailyPoint> dailyBreakdown
) {}
