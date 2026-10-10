package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsOverviewResponse(
    String period,
    String periodFrom,
    String periodTo,
    TaxAnalyticsKpiResponse kpi,
    List<TaxAnalyticsRegionCardResponse> regions
) {}
