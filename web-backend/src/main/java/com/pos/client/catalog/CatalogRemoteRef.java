package com.pos.client.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Wire DTO for catalog-service {@code ProductRefResponse}. Maps 1:1 to {@code ProductRef}.
 */
public record CatalogRemoteRef(
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
