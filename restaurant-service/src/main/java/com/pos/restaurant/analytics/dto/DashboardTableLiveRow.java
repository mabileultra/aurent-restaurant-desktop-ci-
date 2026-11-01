package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

public record DashboardTableLiveRow(
    Integer hallId,
    String tableCode,
    BigDecimal amount,
    long openMinutes,
    String status
) {
}
