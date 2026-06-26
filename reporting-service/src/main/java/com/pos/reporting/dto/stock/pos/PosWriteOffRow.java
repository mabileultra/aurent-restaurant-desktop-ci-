package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PosWriteOffRow(
    UUID id,
    Instant createdAt,
    UUID productId,
    String productName,
    String sku,
    BigDecimal quantity,
    String reason,
    String notes,
    Integer storeId,
    String storeName,
    String createdByName,
    BigDecimal lossAmount
) {
}
