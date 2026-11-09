package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsProductRankResponse(
    String productName,
    BigDecimal quantity,
    BigDecimal amount
) {
}
