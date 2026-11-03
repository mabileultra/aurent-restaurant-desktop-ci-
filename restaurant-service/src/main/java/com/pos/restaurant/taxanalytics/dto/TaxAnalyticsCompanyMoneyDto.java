package com.pos.restaurant.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyMoneyDto(
    int companyId,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal weekTurnover,
    BigDecimal prevWeekTurnover
) {
}
