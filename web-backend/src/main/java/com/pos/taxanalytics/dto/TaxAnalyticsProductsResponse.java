package com.pos.taxanalytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

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
    @JsonProperty("topProducts")
    public List<TaxAnalyticsProductRankResponse> topProducts() {
        return top;
    }

    @JsonProperty("lowProducts")
    public List<TaxAnalyticsProductRankResponse> lowProducts() {
        return bottom;
    }
}
