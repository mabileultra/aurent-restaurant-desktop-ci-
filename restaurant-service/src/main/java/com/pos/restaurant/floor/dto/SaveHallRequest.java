package com.pos.restaurant.floor.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SaveHallRequest(
    @NotBlank String name,
    @NotNull @Min(0) Integer sortOrder,
    @DecimalMin("0") @DecimalMax("100") BigDecimal servicePercent
) {}
