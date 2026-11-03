package com.pos.taxanalytics.client.dto;

import java.math.BigDecimal;

public record TaxAnalyticsDayMoneyDto(
    String saleDate,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover
) {
}
