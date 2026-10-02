package com.pos.restaurant.report.dto;

import java.math.BigDecimal;
import java.util.List;

/** Dish amounts are menu price × quantity, before order-level discount and service. */
public record DishSalesReportResponse(
    List<DishSalesReportRow> rows,
    BigDecimal netQuantity,
    BigDecimal grossAmount,
    BigDecimal refundAmount,
    BigDecimal netAmount
) {
}
