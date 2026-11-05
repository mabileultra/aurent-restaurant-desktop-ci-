package com.pos.taxanalytics.dto;

public record TaxAnalyticsCompareResponse(
    String periodFrom,
    String periodTo,
    String compareFrom,
    String compareTo,
    TaxAnalyticsKpiResponse current,
    TaxAnalyticsKpiResponse baseline
) {
}
