package com.pos.restaurant.recipe.support;

import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecipeExplosionTest {

    private final RecipeExplosion explosion = new RecipeExplosion();

    @Test
    void writesOffGrossNotNet() {
        UUID menuId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID recipeId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID productId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        MenuItem menuItem = MenuItem.builder().id(menuId).name("Lagman").build();
        Recipe recipe = Recipe.builder().id(recipeId).menuItem(menuItem).outputQty(BigDecimal.ONE).build();
        RecipeLine line = RecipeLine.builder()
            .recipe(recipe)
            .productId(productId)
            .qtyGross(new BigDecimal("0.300"))
            .qtyNet(new BigDecimal("0.240"))
            .build();
        FloorOrderItem item = FloorOrderItem.builder()
            .menuItem(menuItem)
            .quantity(new BigDecimal("1"))
            .itemStatus(OrderItemStatus.SERVED)
            .build();

        Map<UUID, BigDecimal> consumed = explosion.explode(
            List.of(item),
            Map.of(menuId, recipe),
            Map.of(recipeId, List.of(line))
        );

        assertEquals(0, new BigDecimal("0.300").compareTo(consumed.get(productId)));
    }
}
