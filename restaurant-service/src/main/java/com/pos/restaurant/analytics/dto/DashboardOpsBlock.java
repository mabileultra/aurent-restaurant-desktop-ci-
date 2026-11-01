package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

/**
 * Live operational snapshot for the store (not period-scoped).
 */
public record DashboardOpsBlock(
    long openOrders,
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
    int shiftSaleCount
) {
}
