package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Событие складского движения (для reporting read-model).
 */
public record StockMovementRecordedEvent(
    UUID movementId,
    Integer companyId,
    Integer storeId,
    String storeName,
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String movementType,
    String writeOffReason,
    BigDecimal quantity,
    String notes,
    UUID referenceId,
    String referenceNumber,
    UUID createdBy,
    String createdByName,
    Instant createdAt,
    LocalDate transactionDate,
    BigDecimal unitCostEstimate
) {
}
