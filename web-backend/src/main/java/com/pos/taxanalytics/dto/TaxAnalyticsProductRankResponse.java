package com.pos.taxanalytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record TaxAnalyticsProductRankResponse(
    int rank,
    String productName,
    String companyName,
    BigDecimal quantity,
    BigDecimal amount,
    BigDecimal unitPrice
) {
    @JsonProperty("name")
    public String name() {
        return productName;
    }

    @JsonProperty("totalAmount")
    public BigDecimal totalAmount() {
        return amount;
    }
}
