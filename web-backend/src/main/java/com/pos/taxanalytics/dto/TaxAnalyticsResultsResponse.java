package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsResultsResponse(
    String period,
    String periodFrom,
    String periodTo,
    String level,
    String titleHint,
    long totalElements,
    int page,
    int size,
    List<TaxAnalyticsResultRowResponse> rows,
    /** Region/district KPI snapshot so FE can skip a second /overview call. */
    TaxAnalyticsKpiResponse summary
) {
    public TaxAnalyticsResultsResponse(
        String period,
        String periodFrom,
        String periodTo,
        String level,
        String titleHint,
        long totalElements,
        int page,
        int size,
        List<TaxAnalyticsResultRowResponse> rows
    ) {
        this(period, periodFrom, periodTo, level, titleHint, totalElements, page, size, rows, null);
    }
}
