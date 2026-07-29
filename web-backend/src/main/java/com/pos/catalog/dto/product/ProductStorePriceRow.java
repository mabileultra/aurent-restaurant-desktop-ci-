package com.pos.catalog.dto.product;

import java.math.BigDecimal;

public record ProductStorePriceRow(
    Integer storeId,
    String storeName,
    BigDecimal price
) {}
