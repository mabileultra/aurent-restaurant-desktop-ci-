package com.pos.reporting.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StockReceiptRowResponse(
    UUID id,
    String receiptNumber,
    Instant createdAt,
    String supplierName,
    BigDecimal totalQuantity,
    BigDecimal totalCost
) {
}
