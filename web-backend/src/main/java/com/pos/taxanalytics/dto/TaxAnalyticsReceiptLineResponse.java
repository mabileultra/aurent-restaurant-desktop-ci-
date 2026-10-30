package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsReceiptLineResponse(
    String productName,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal taxAmount
) {
}
