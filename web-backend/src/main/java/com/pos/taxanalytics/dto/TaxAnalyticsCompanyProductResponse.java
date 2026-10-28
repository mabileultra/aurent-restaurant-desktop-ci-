package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyProductResponse(
    String name,
    BigDecimal quantity,
    BigDecimal amount
) {
}
