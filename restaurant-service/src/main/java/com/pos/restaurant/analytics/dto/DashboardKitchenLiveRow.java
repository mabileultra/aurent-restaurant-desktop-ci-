package com.pos.restaurant.analytics.dto;

public record DashboardKitchenLiveRow(
    int orderNo,
    String tableCode,
    long ageMinutes,
    String status
) {
}
