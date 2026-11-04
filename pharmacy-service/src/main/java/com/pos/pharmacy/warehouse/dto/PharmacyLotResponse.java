package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Партия склада + provenance источника (RECEIPT / OPENING). */
public record PharmacyLotResponse(
    UUID id,
    UUID productId,
    Integer storeId,
    String batchNumber,
    LocalDate expiryDate,
    BigDecimal quantity,
    BigDecimal purchasePrice,
    BigDecimal unitSellingPrice,
    UUID receiptLineId,
    UUID receiptId,
    String receiptNumber,
    String receiptType
) {}
