package com.pos.restaurant.revenue.service;

import com.pos.restaurant.recipe.dto.IngredientConsumeRequest;

public interface PosInventoryClient {

    boolean consumeIngredients(IngredientConsumeRequest request);
}
