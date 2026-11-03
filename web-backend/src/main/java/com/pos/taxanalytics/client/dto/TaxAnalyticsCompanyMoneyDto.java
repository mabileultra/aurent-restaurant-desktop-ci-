package com.pos.taxanalytics.client.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyMoneyDto(
    int companyId,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal weekTurnover,
    BigDecimal prevWeekTurnover
) {
}
