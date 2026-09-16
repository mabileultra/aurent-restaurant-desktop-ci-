package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PharmacyStockReceiptResponse(
    UUID id,
    String receiptNumber,
    String status,
    LocalDate documentDate,
    String receiptType,
    BigDecimal defaultMarkupPercent,
    String invoiceNumber,
    LocalDate invoiceDate,
    String contractNumber,
    BigDecimal financialDiscount,
    String paymentType,
    UUID supplierId,
    String supplierName,
    Integer storeId,
    String storeName,
    String notes,
    BigDecimal totalQuantity,
    BigDecimal totalCost,
    BigDecimal totalRetail,
    int lineCount,
    String createdByName,
    Instant createdAt,
    Instant activatedAt,
    String activatedByName,
    List<PharmacyStockReceiptLineResponse> lines
) {}
