package com.pos.taxanalytics.dto;

import java.math.BigDecimal;
import java.util.List;

public record TaxAnalyticsReceiptDetailResponse(
    String saleId,
    String receiptNumber,
    String createdAt,
    String storeName,
    String cashierName,
    BigDecimal subtotal,
    BigDecimal taxTotal,
    BigDecimal discountTotal,
    BigDecimal totalAmount,
    String paymentMethod,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    String status,
    String fiscalStatus,
    String fiscalSign,
    String fiscalReceiptSeq,
    String fiscalQrUrl,
    String fiscalTerminalId,
    boolean printFiscalQr,
    List<TaxAnalyticsReceiptLineResponse> items
) {
}
