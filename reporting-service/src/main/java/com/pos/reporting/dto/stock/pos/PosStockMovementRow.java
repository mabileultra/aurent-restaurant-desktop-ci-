package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PosStockMovementRow(
    UUID id,
    Instant createdAt,
    String movementType,
    UUID productId,
    String productName,
    String sku,
    BigDecimal quantity,
    String notes,
    String writeOffReason,
    Integer storeId,
    String storeName,
    String createdByName,
    UUID referenceId,
    String receiptNumber
) {
}
