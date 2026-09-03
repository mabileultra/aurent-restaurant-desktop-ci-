package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DashboardResponse(
    Instant from,
    Instant to,
    BigDecimal revenue,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    long closedOrders,
    long openOrders,
    long cancelledOrders,
    BigDecimal averageCheck,
    long guests,
    long occupiedTables,
    long freeTables,
    long totalTables,
    long kitchenWaiting,
    long reservationsActive,
    boolean shiftOpen,
    BigDecimal shiftRevenue,
    int shiftSaleCount
) {
}
