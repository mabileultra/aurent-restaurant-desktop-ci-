package com.pos.taxanalytics.client.dto;

import java.math.BigDecimal;

public record TaxAnalyticsVerticalReceiptLineDto(
    String productName,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal taxAmount
) {
}
