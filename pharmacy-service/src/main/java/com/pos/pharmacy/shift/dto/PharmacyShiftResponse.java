package com.pos.pharmacy.shift.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Shape aligned with web-backend CashierShiftResponse for shared FE modal. */
public record PharmacyShiftResponse(
    UUID id,
    Integer storeId,
    String storeName,
    String cashierName,
    Long cashRegisterId,
    Integer registerNumber,
    String status,
    Instant openedAt,
    Instant closedAt,
    int saleCount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal vatAmount,
    Long zReportId,
    ShiftSoldItemsReport soldItems
) {
}
