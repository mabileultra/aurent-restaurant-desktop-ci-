package com.pos.taxanalytics.dto;

import java.math.BigDecimal;
import java.util.List;

public record TaxAnalyticsReceiptsResponse(
    String date,
    String kind,
    long totalElements,
    int page,
    int size,
    List<TaxAnalyticsReceiptRowResponse> rows
) {
}
