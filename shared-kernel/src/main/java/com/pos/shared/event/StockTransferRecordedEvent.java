package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Событие перемещения товара для reporting read-model.
 */
public record StockTransferRecordedEvent(
    UUID transferId,
    Integer companyId,
    String transferNumber,
    Integer fromStoreId,
    String fromStoreName,
    Integer toStoreId,
    String toStoreName,
    String notes,
    BigDecimal totalQuantity,
    UUID createdBy,
    String createdByName,
    Instant createdAt,
    LocalDate transactionDate
) {
}
