package com.pos.dto.report.sales;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record StoreSalesRowResponse(
    Integer storeId,
    String storeName,
    long receiptCount,
    long netQuantity,
    long quantityReturned,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin,
    LocalDate firstSaleDate,
    LocalDate lastSaleDate,
    Instant lastActivityAt
) {}
