package com.pos.catalog.dto.product;

import java.math.BigDecimal;

/** Aggregates for the products catalog list (same filters as the page). */
public record ProductCatalogTotalsResponse(
    long productCount,
    BigDecimal stockQuantityTotal,
    BigDecimal stockValueTotal,
    BigDecimal stockCostTotal
) {
    public static ProductCatalogTotalsResponse empty() {
        return new ProductCatalogTotalsResponse(0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }
}
