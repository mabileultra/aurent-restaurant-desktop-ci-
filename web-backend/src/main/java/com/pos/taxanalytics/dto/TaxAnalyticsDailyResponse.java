package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsDailyResponse(
    String periodFrom,
    String periodTo,
    List<TaxAnalyticsDayPointResponse> days
) {
}
