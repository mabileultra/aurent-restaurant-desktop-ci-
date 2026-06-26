package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Снимок каталога товара для reporting read-model.
 */
public record ProductSnapshotEvent(
    UUID productId,
    Integer companyId,
    String sku,
    String productName,
    String barcode,
    Integer categoryId,
    String categoryName,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    int lowStockAlert,
    boolean active,
    Instant updatedAt
) {
}
