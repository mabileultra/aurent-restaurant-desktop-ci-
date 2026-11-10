package com.pos.pharmacy.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsReceiptRowDto(
    String saleId,
    String receiptNumber,
    String createdAt,
    String storeName,
    BigDecimal totalAmount,
    String fiscalStatus,
    boolean hasQr
) {
}
