package com.pos.pharmacy.catalog.dto;

import java.math.BigDecimal;

public record ProductStorePriceRow(
    Integer storeId,
    String storeName,
    BigDecimal price
) {}
