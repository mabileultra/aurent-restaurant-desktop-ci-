package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyWeekResponse(
    String weekFrom,
    String weekTo,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover,
    BigDecimal deltaAmount,
    BigDecimal deltaPct
) {
}
