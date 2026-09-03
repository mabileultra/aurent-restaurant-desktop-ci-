package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

public record HourSalesRow(
    int hour,
    long paymentCount,
    BigDecimal amount
) {
}
