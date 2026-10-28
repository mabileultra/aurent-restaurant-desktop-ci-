package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsCompaniesResponse(
    String period,
    String from,
    String to,
    String weekFrom,
    String weekTo,
    String prevWeekFrom,
    String prevWeekTo,
    long totalElements,
    int page,
    int size,
    List<TaxAnalyticsCompanyRowResponse> rows
) {
}
