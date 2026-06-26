package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Событие инвентаризации для reporting read-model.
 */
public record StockInventoryRecordedEvent(
    UUID inventoryId,
    Integer companyId,
    String inventoryNumber,
    Integer storeId,
    String storeName,
    String status,
    String notes,
    int totalLines,
    BigDecimal totalDifference,
    UUID createdBy,
    String createdByName,
    Instant createdAt,
    LocalDate transactionDate
) {
}
