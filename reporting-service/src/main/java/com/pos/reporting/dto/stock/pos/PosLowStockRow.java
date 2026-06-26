package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.util.UUID;

public record PosLowStockRow(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal deficit,
    BigDecimal costPrice,
    BigDecimal stockValueEstimate
) {
}
