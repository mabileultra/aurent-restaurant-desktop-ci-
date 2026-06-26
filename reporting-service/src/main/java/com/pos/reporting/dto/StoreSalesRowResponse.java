package com.pos.reporting.dto;

import java.math.BigDecimal;

public record StoreSalesRowResponse(
    Integer storeId,
    String storeName,
    long receiptCount,
    long netQuantity,
    long quantityReturned,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin
) {
}
