package com.pos.restaurant.recipe.repository;

import com.pos.restaurant.recipe.entity.RecipeLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RecipeLineRepository extends JpaRepository<RecipeLine, UUID> {

    List<RecipeLine> findByRecipeIdOrderBySortOrderAscProductNameAsc(UUID recipeId);

    List<RecipeLine> findByRecipeIdIn(Collection<UUID> recipeIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByRecipeId(UUID recipeId);
}
