package com.pos.scales.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EncodeWeightBarcodeRequest(
    @NotBlank String plu,
    @NotNull @DecimalMin("0.001") BigDecimal weightKg
) {}
