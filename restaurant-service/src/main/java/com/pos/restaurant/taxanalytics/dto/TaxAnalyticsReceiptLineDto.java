package com.pos.restaurant.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsReceiptLineDto(
    String productName,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal taxAmount
) {
}
