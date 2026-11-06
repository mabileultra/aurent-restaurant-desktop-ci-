package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsReceiptListResponse(
    String periodFrom,
    String periodTo,
    long totalElements,
    int page,
    int size,
    List<TaxAnalyticsReceiptRowResponse> rows
) {
}
