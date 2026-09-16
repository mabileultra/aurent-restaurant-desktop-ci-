package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdatePharmacyStockReceiptRequest(
    UUID supplierId,
    Integer storeId,
    LocalDate documentDate,
    String receiptType,
    BigDecimal defaultMarkupPercent,
    String invoiceNumber,
    LocalDate invoiceDate,
    String contractNumber,
    BigDecimal financialDiscount,
    String paymentType,
    String notes
) {}
