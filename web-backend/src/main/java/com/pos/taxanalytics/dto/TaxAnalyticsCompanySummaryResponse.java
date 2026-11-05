package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanySummaryResponse(
    long companiesWithSales,
    BigDecimal top5SharePct,
    BigDecimal fiscalSharePct,
    BigDecimal nonFiscalSharePct
) {
}
