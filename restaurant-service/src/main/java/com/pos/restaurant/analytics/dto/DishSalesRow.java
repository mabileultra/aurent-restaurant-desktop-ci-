package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;

public record DishSalesRow(
    String dishName,
    BigDecimal quantity,
    BigDecimal amount
) {
}
