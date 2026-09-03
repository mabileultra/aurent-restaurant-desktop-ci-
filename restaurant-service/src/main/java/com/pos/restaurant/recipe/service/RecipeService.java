package com.pos.restaurant.recipe.service;

import com.pos.restaurant.recipe.dto.RecipeResponse;
import com.pos.restaurant.recipe.dto.SaveRecipeRequest;

import java.util.List;
import java.util.UUID;

public interface RecipeService {

    List<RecipeResponse> list(Integer storeId);

    RecipeResponse getByMenuItem(UUID menuItemId);

    RecipeResponse save(UUID menuItemId, SaveRecipeRequest request);
}
