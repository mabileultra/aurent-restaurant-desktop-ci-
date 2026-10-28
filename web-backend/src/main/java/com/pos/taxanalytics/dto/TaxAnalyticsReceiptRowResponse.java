package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsReceiptRowResponse(
    String saleId,
    String receiptNumber,
    String createdAt,
    String storeName,
    BigDecimal totalAmount,
    String fiscalStatus,
    boolean hasQr
) {
}
