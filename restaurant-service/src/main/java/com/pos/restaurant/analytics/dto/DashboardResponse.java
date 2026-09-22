package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Restaurant admin dashboard: period finance KPIs + live floor/kitchen snapshot.
 * Net sales = paid amounts in period (refunds not re-added as positive).
 */
public record DashboardResponse(
    Instant from,
    Instant to,
    BigDecimal revenue,
    BigDecimal previousRevenue,
    BigDecimal revenueDeltaPct,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    long closedOrders,
    long previousClosedOrders,
    long closedOrdersDelta,
    long openOrders,
    long cancelledOrders,
    BigDecimal averageCheck,
    BigDecimal previousAverageCheck,
    BigDecimal averageCheckDeltaPct,
    long guests,
    long occupiedTables,
    long freeTables,
    long waitingPaymentTables,
    long reservedTables,
    long blockedTables,
    long totalTables,
    long kitchenNew,
    long kitchenPreparing,
    long kitchenReady,
    long kitchenWaiting,
    long reservationsActive,
    boolean shiftOpen,
    BigDecimal shiftRevenue,
    int shiftSaleCount,
    boolean costComplete,
    BigDecimal cogs,
    BigDecimal grossProfit,
    BigDecimal grossMarginPct,
    List<HourSalesRow> byHour,
    List<DishSalesRow> byDish,
    List<DashboardTableLiveRow> liveTables,
    List<DashboardKitchenLiveRow> kitchenQueue,
    List<DashboardRecentOrderRow> recentOrders
) {
}
