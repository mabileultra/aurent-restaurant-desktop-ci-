package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PharmacyReceiptRevalueRequest(
    List<UUID> lineIds,
    @DecimalMin("0") @DecimalMax("100") BigDecimal vatPercent,
    @DecimalMin("0") BigDecimal markupPercent
) {}
