package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PosDeadStockRow(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    BigDecimal stockQuantity,
    BigDecimal stockValue,
    LocalDate lastSaleDate,
    int daysWithoutSale
) {
}
