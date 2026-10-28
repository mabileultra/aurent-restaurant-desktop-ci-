package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanySupplyRowResponse(
    String receiptNumber,
    String documentDate,
    String supplierName,
    BigDecimal totalQuantity,
    BigDecimal totalCost
) {
}
