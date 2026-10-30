package com.pos.taxanalytics.dto;

import java.math.BigDecimal;
import java.util.List;

public record TaxAnalyticsCompanySupplyResponse(
    long receiptCount,
    BigDecimal totalQuantity,
    BigDecimal totalCost,
    BigDecimal totalRetail,
    List<TaxAnalyticsCompanySupplyRowResponse> rows
) {
}
