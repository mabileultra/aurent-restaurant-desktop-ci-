package com.pos.restaurant.recipe.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.recipe.dto.RecipeResponse;
import com.pos.restaurant.recipe.dto.SaveRecipeRequest;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.recipe.service.RecipeService;
import com.pos.restaurant.recipe.support.RecipeResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeServiceImpl implements RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeLineRepository recipeLineRepository;
    private final FloorTenantSupport tenantSupport;
    private final RecipeResponseAssembler assembler;
    private final RecipeSaveHandler saveHandler;

    @Override
    public List<RecipeResponse> list(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<Recipe> recipes = recipeRepository.findByCompanyIdAndStoreId(companyId, storeId);
        if (recipes.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<com.pos.restaurant.recipe.entity.RecipeLine>> lines = recipeLineRepository
            .findByRecipeIdIn(recipes.stream().map(Recipe::getId).toList())
            .stream()
            .collect(Collectors.groupingBy(line -> line.getRecipe().getId()));
        return recipes.stream()
            .map(recipe -> assembler.toResponse(recipe, lines.getOrDefault(recipe.getId(), List.of())))
            .toList();
    }

    @Override
    public RecipeResponse getByMenuItem(UUID menuItemId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Recipe recipe = recipeRepository.findByMenuItemIdAndCompanyId(menuItemId, companyId)
            .orElseThrow(() -> new NotFoundException("Recipe not found for menu item: " + menuItemId));
        return assembler.toResponse(recipe, recipeLineRepository.findByRecipeIdOrderBySortOrderAscProductNameAsc(recipe.getId()));
    }

    @Override
    @Transactional
    public RecipeResponse save(UUID menuItemId, SaveRecipeRequest request) {
        return saveHandler.handle(menuItemId, request);
    }
}
