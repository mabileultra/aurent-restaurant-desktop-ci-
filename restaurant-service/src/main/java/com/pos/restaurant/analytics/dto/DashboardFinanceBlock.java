package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Period-scoped finance KPIs and sales breakdowns.
 * Deltas compare against the previous window of equal length.
 */
public record DashboardFinanceBlock(
    BigDecimal revenue,
    BigDecimal previousRevenue,
    BigDecimal revenueDeltaPct,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    long closedOrders,
    long previousClosedOrders,
    long closedOrdersDelta,
    long cancelledOrders,
    long guests,
    BigDecimal averageCheck,
    BigDecimal previousAverageCheck,
    BigDecimal averageCheckDeltaPct,
    List<HourSalesRow> byHour,
    List<DishSalesRow> byDish
) {
}
