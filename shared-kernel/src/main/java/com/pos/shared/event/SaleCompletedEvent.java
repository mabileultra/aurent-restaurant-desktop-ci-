package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Событие завершённой продажи (для message bus, фаза 5).
 */
public record SaleCompletedEvent(
    Integer companyId,
    Integer storeId,
    UUID saleId,
    String receiptNumber,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    String paymentMethod,
    LocalDate transactionDate,
    UUID createdBy,
    long itemsSold,
    String storeName,
    String cashierName,
    String saleStatus,
    List<SaleLineSnapshot> lines
) {
}
