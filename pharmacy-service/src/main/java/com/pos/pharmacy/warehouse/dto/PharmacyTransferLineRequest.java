package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record PharmacyTransferLineRequest(
    @NotNull UUID productId,
    @NotNull BigDecimal quantity
) {}
