package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PharmacyInventoryResponse(
    UUID id,
    String inventoryNumber,
    Integer storeId,
    String notes,
    int totalLines,
    BigDecimal totalDifference,
    Instant createdAt,
    UUID createdBy,
    List<PharmacyInventoryLineResponse> lines
) {}
