package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PosStockBalanceRow(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal costPrice,
    BigDecimal stockValue
) {
}
