package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PharmacyStockMovementResponse(
    UUID id,
    Integer storeId,
    UUID productId,
    UUID lotId,
    String movementType,
    BigDecimal quantity,
    String referenceType,
    UUID referenceId,
    String notes,
    Instant createdAt,
    UUID createdBy
) {}
