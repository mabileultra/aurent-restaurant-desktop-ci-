package com.pos.pharmacy.pricing.registry.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Журнал: явно «было → предел → стало». */
public record PriceChangeJournalResponse(
    UUID id,
    UUID snapshotId,
    UUID productId,
    String productName,
    String barcode,
    String pharmId,
    String matchedBy,
    BigDecimal oldSellingPrice,
    BigDecimal limitPrice,
    BigDecimal newSellingPrice,
    String status,
    String appliedBy,
    Instant appliedAt,
    Instant createdAt
) {}
