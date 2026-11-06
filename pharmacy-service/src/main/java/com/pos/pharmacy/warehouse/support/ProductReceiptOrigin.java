package com.pos.pharmacy.warehouse.support;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProductReceiptOrigin(
    UUID productId,
    UUID receiptId,
    String receiptNumber,
    String receiptType,
    UUID supplierId,
    LocalDate documentDate,
    Instant createdAt
) {}
