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
    List<TaxAnalyticsResultRowResponse> rows
) {}
