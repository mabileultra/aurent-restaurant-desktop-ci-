package com.pos.reporting.dto.stock.pos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PosStockTransferRow(
    UUID id,
    String transferNumber,
    Integer fromStoreId,
    String fromStoreName,
    Integer toStoreId,
    String toStoreName,
    String notes,
    BigDecimal totalQuantity,
    String createdByName,
    Instant createdAt
) {
}
