package com.pos.restaurant.modifier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SaveModifierOptionRequest(
    @NotBlank String name,
    @NotNull BigDecimal priceDelta,
    Integer sortOrder
) {}
