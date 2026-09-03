package com.pos.restaurant.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record SaveRecipeRequest(
    @NotNull @DecimalMin("0.001") BigDecimal outputQty,
    @Valid List<SaveRecipeLineRequest> lines
) {}
