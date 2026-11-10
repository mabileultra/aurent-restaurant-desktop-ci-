package com.pos.taxanalytics.client.dto;

import java.math.BigDecimal;

public record TaxAnalyticsVerticalReceiptRowDto(
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
