package com.pos.catalog.dto.ref;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Weight-scale catalog slice for Scales module (list / PLU / export).
 * Not a full product card — use {@link com.pos.catalog.dto.product.ProductResponse} for admin/POS card.
 */
public record WeightProductRef(
    UUID id,
    String sku,
    String name,
    String plu,
    String barcode,
    BigDecimal sellingPrice,
    String unitCode,
    int quantityScale,
    boolean allowFraction,
    boolean active,
    BigDecimal stockQuantity
) {
}
