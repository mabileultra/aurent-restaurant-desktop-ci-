package com.pos.restaurant.recipe.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RecipeResponse(
    UUID id,
    UUID menuItemId,
    String menuItemName,
    BigDecimal outputQty,
    List<RecipeLineResponse> lines
) {}
