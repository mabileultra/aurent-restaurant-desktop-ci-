package com.pos.restaurant.recipe.repository;

import com.pos.restaurant.recipe.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

    Optional<Recipe> findByMenuItemIdAndCompanyId(UUID menuItemId, Integer companyId);

    @Query("""
        select r from Recipe r
        join fetch r.menuItem
        where r.companyId = :companyId and r.storeId = :storeId
        """)
    List<Recipe> findByCompanyIdAndStoreId(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );

    List<Recipe> findByMenuItemIdInAndCompanyId(Collection<UUID> menuItemIds, Integer companyId);
}
