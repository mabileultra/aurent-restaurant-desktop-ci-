package com.pos.restaurant.recipe.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.recipe.dto.RecipeResponse;
import com.pos.restaurant.recipe.dto.SaveRecipeLineRequest;
import com.pos.restaurant.recipe.dto.SaveRecipeRequest;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.recipe.support.RecipeNetQtyCalculator;
import com.pos.restaurant.recipe.support.RecipeResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RecipeSaveHandler {

    private final MenuItemRepository menuItemRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeLineRepository recipeLineRepository;
    private final FloorTenantSupport tenantSupport;
    private final RecipeNetQtyCalculator netQtyCalculator;
    private final RecipeResponseAssembler assembler;

    @Transactional
    public RecipeResponse handle(UUID menuItemId, SaveRecipeRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem menuItem = menuItemRepository.findByIdAndCompanyId(menuItemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + menuItemId));
        List<SaveRecipeLineRequest> lines = request.lines() == null ? List.of() : request.lines();
        if (lines.isEmpty()) {
            throw new BusinessException("Tech card must have at least one ingredient");
        }
        Recipe recipe = recipeRepository.findByMenuItemIdAndCompanyId(menuItemId, companyId)
            .orElseGet(() -> Recipe.builder()
                .companyId(companyId)
                .storeId(menuItem.getStoreId())
                .menuItem(menuItem)
                .build());
        recipe.setOutputQty(request.outputQty());
        Recipe saved = recipeRepository.save(recipe);
        recipeLineRepository.deleteByRecipeId(saved.getId());
        List<RecipeLine> persisted = new ArrayList<>();
        int sort = 0;
        for (SaveRecipeLineRequest line : lines) {
            BigDecimal waste = line.wastePercent() == null ? BigDecimal.ZERO : line.wastePercent();
            RecipeLine entity = RecipeLine.builder()
                .recipe(saved)
                .productId(line.productId())
                .productName(line.productName().trim())
                .unit(line.unit() == null || line.unit().isBlank() ? "kg" : line.unit().trim())
                .qtyGross(line.qtyGross())
                .wastePercent(waste)
                .qtyNet(netQtyCalculator.netQty(line.qtyGross(), waste))
                .sortOrder(sort++)
                .build();
            persisted.add(recipeLineRepository.save(entity));
        }
        LogUtil.info(RecipeSaveHandler.class, "Recipe saved: menuItemId={}, lines={}", menuItemId, persisted.size());
        return assembler.toResponse(saved, persisted);
    }
}
