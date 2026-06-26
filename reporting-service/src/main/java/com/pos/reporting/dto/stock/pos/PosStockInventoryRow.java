package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PosStockInventoryRow(
    UUID id,
    String inventoryNumber,
    Integer storeId,
    String storeName,
    String status,
    String notes,
    int totalLines,
    BigDecimal totalDifference,
    String createdByName,
    Instant createdAt
) {
}
