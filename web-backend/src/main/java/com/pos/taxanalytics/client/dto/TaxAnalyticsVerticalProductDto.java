package com.pos.taxanalytics.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TaxAnalyticsVerticalProductDto(
    @JsonProperty("product_name") String productName,
    BigDecimal quantity,
    BigDecimal amount
) {
}
