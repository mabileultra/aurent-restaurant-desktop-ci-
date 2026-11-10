package com.pos.restaurant.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsReceiptRowDto(
    String saleId,
    String receiptNumber,
    String createdAt,
    String storeName,
    BigDecimal totalAmount,
    String fiscalStatus,
    boolean hasQr,
    BigDecimal itemsQuantity
) {
}
