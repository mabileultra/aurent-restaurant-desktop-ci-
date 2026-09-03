package com.pos.restaurant.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SalesReportResponse(
    Instant from,
    Instant to,
    BigDecimal totalRevenue,
    long paymentCount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    List<DishSalesRow> byDish,
    List<HourSalesRow> byHour
) {
}
