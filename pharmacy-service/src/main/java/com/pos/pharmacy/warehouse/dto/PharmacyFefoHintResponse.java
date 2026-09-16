package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PharmacyFefoHintResponse(
    UUID productId,
    String batchNumber,
    LocalDate expiryDate,
    BigDecimal lotQuantity
) {}
