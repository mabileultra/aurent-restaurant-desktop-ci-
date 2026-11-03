package com.pos.taxanalytics.client.dto;

import java.math.BigDecimal;
import java.util.List;

public record TaxAnalyticsVerticalSnapshotDto(
    List<TaxAnalyticsCompanyMoneyDto> companies,
    List<Integer> connectedCompanyIds,
    BigDecimal periodFiscalTotal,
    BigDecimal periodNonFiscalTotal
) {
}
