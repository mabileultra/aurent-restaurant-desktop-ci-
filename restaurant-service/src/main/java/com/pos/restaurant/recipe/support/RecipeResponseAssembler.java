package com.pos.restaurant.recipe.support;

import com.pos.restaurant.recipe.dto.RecipeLineResponse;
import com.pos.restaurant.recipe.dto.RecipeResponse;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RecipeResponseAssembler {

    public RecipeResponse toResponse(Recipe recipe, List<RecipeLine> lines) {
        return new RecipeResponse(
            recipe.getId(),
            recipe.getMenuItem().getId(),
            recipe.getMenuItem().getName(),
            recipe.getOutputQty(),
            lines.stream().map(this::toLine).toList()
        );
    }

    public RecipeLineResponse toLine(RecipeLine line) {
        return new RecipeLineResponse(
            line.getId(),
            line.getProductId(),
            line.getProductName(),
            line.getUnit(),
            line.getQtyGross(),
            line.getWastePercent(),
            line.getQtyNet(),
            line.getSortOrder()
        );
    }
}
