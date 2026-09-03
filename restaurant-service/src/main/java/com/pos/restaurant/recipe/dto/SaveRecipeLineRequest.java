package com.pos.restaurant.recipe.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SaveRecipeLineRequest(
    @NotNull UUID productId,
    @NotBlank String productName,
    String unit,
    @NotNull @DecimalMin("0.001") BigDecimal qtyGross,
    BigDecimal wastePercent
) {}
