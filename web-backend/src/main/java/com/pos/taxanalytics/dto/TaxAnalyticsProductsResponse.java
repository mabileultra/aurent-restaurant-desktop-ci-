package com.pos.taxanalytics.dto;

import java.util.List;

public record TaxAnalyticsProductsResponse(
    String period,
    String from,
    String to,
    String regionCode,
    String districtCode,
    String businessType,
    int limit,
    List<TaxAnalyticsProductRankResponse> top,
    List<TaxAnalyticsProductRankResponse> bottom
) {
}
