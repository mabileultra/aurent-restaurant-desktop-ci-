package com.pos.restaurant.recipe.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record IngredientConsumeRequest(
    Integer companyId,
    Integer storeId,
    UUID saleId,
    UUID createdBy,
    String receiptNumber,
    List<IngredientConsumeLine> lines
) {
    public record IngredientConsumeLine(
        UUID productId,
        BigDecimal quantity
    ) {}
}
