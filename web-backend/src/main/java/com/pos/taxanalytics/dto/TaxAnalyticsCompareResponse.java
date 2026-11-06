package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsCompareResponse(
    String periodFrom,
    String periodTo,
    String compareFrom,
    String compareTo,
    TaxAnalyticsKpiResponse current,
    TaxAnalyticsKpiResponse baseline,
    List<TaxAnalyticsResultRowResponse> currentRegions,
    List<TaxAnalyticsResultRowResponse> baselineRegions,
    List<TaxAnalyticsCompanyRowResponse> currentCompanies,
    List<TaxAnalyticsCompanyRowResponse> baselineCompanies
) {
}
