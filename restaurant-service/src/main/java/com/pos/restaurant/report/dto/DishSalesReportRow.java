package com.pos.restaurant.report.dto;

import java.math.BigDecimal;

public record DishSalesReportRow(
    String name,
    String category,
    BigDecimal quantity,
    BigDecimal returnedQuantity,
    BigDecimal netQuantity,
    BigDecimal grossAmount,
    BigDecimal refundAmount,
    BigDecimal netAmount,
    long orderCount,
    BigDecimal sharePercent
) {
}
