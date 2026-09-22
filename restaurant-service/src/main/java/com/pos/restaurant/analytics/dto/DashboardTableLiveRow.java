package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

public record DashboardTableLiveRow(
    String tableCode,
    BigDecimal amount,
    long openMinutes,
    String status
) {
}
