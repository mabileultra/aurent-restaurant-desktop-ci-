package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyDayResponse(
    String date,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover
) {
}
