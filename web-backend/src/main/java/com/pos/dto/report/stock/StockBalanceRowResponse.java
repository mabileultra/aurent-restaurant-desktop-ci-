package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.UUID;

/** Live stock balance row (store_stock + product prices). */
public record StockBalanceRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal costPrice,
    BigDecimal stockValue
) {}
