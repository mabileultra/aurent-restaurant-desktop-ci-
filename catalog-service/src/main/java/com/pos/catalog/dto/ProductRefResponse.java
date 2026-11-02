package com.pos.catalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Cross-service catalog contract (mirrors web-backend ProductRef). */
public record ProductRefResponse(
    UUID id,
    Integer companyId,
    String sku,
    String name,
    String barcode,
    String ikpu,
    BigDecimal sellingPrice,
    BigDecimal costPrice,
    String unitCode,
    boolean active,
    boolean weighted
) {
}
