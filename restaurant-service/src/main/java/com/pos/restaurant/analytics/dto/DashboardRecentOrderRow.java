package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

public record DashboardRecentOrderRow(
    int orderNo,
    String tableCode,
    String waiterUserId,
    String waiterName,
    BigDecimal amount,
    String status
) {
}
