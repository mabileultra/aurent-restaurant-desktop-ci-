package com.pos.restaurant.recipe.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class RecipeExplosion {

    public Map<UUID, BigDecimal> explode(
        List<FloorOrderItem> items,
        Map<UUID, Recipe> recipesByMenuItem,
        Map<UUID, List<RecipeLine>> linesByRecipe
    ) {
        Map<UUID, BigDecimal> consumed = new HashMap<>();
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == OrderItemStatus.CANCELLED || item.getMenuItem() == null) {
                continue;
            }
            Recipe recipe = recipesByMenuItem.get(item.getMenuItem().getId());
            if (recipe == null || recipe.getOutputQty() == null || recipe.getOutputQty().signum() <= 0) {
                continue;
            }
            BigDecimal portions = item.getQuantity().divide(recipe.getOutputQty(), 6, RoundingMode.HALF_UP);
            for (RecipeLine line : linesByRecipe.getOrDefault(recipe.getId(), List.of())) {
                BigDecimal qty = line.getQtyNet().multiply(portions).setScale(3, RoundingMode.HALF_UP);
                consumed.merge(line.getProductId(), qty, BigDecimal::add);
            }
        }
        consumed.entrySet().removeIf(entry -> entry.getValue().signum() <= 0);
        return consumed;
    }
}
