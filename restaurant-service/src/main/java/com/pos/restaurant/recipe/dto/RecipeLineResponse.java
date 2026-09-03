package com.pos.restaurant.recipe.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RecipeLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String unit,
    BigDecimal qtyGross,
    BigDecimal wastePercent,
    BigDecimal qtyNet,
    int sortOrder
) {}
