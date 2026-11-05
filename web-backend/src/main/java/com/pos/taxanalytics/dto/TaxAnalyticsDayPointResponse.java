package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsDayPointResponse(
    String date,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover
) {
}
