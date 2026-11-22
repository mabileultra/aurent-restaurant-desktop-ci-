package com.pos.sales.dto.cashier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CashierShiftResponse(
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
    BigDecimal humoAmount,
    BigDecimal uzcardAmount,
    BigDecimal paymeAmount,
    BigDecimal cashlessAmount,
    BigDecimal vatAmount,
    Long zReportId,
    ShiftSoldItemsReport soldItems
) {}
