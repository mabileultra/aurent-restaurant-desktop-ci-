package com.pos.pharmacy.marks.dto;

import com.pos.pharmacy.marks.entity.StockMarkStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Строка мониторинга ASL: локальный статус выбытия + что вернул ASL / ошибка опроса.
 */
public record StockMarkListItemResponse(
    UUID id,
    Integer storeId,
    UUID productId,
    String productName,
    String markCode,
    StockMarkStatus status,
    String aslStatus,
    UUID saleId,
    String receiptNumber,
    Instant soldAt,
    int withdrawAttempts,
    Instant lastWithdrawAt,
    String lastWithdrawError,
    Instant updatedAt,
    /** true = ждём ASL или есть ошибка опроса / чек не подтвердил списание. */
    boolean needsAttention
) {
}
