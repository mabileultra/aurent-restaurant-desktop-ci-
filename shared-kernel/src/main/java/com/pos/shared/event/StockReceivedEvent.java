package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Событие прихода товара на склад (для message bus, фаза 5).
 */
public record StockReceivedEvent(
    Integer companyId,
    Integer storeId,
    UUID receiptId,
    UUID supplierId,
    BigDecimal totalAmount,
    LocalDate transactionDate,
    UUID createdBy,
    String receiptNumber,
    String supplierName,
    String storeName,
    BigDecimal totalQuantity,
    Instant createdAt
) {
}
