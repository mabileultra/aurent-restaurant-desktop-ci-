package com.pos.catalog.dto.ref;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Cross-module catalog contract (Sales / Inventory / Scales / Integrations).
 * Not a full product card — full CRUD stays on {@code ProductResponse} inside Catalog.
 * Do not expose JPA {@code Product} outside Catalog; use this ref instead.
 */
public record ProductRef(
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
