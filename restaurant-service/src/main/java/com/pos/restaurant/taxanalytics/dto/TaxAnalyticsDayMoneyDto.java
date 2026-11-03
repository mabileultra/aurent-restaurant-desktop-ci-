package com.pos.restaurant.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsDayMoneyDto(
    String saleDate,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover
) {
}
