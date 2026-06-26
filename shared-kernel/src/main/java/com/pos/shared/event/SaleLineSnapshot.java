package com.pos.shared.event;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Строка чека для read-model отчётности (денормализовано из sale_items).
 */
public record SaleLineSnapshot(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    Integer categoryId,
    String categoryName,
    long quantity,
    long quantityReturned,
    BigDecimal revenue,
    BigDecimal costEstimate
) {
}
