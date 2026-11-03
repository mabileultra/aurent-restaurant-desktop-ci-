package com.pos.pharmacy.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyMoneyDto(
    int companyId,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal weekTurnover,
    BigDecimal prevWeekTurnover
) {
}
