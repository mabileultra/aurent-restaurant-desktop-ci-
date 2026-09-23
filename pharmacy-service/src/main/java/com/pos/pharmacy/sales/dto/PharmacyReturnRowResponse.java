package com.pos.pharmacy.sales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Строка журнала возвратов аптеки (совместима с UI returnsModule). */
public record PharmacyReturnRowResponse(
    UUID id,
    Instant createdAt,
    String fiscalModuleId,
    BigDecimal totalAmount,
    int positionsCount,
    String storeName,
    String reason,
    String status,
    String receiptNumber,
    String cashierName,
    Integer storeId
) {
}
