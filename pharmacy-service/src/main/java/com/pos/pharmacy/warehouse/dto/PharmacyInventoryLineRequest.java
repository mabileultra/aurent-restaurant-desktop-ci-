package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record PharmacyInventoryLineRequest(
    @NotNull UUID productId,
    @NotNull BigDecimal countedQuantity
) {}
