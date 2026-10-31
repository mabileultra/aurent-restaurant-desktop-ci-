package com.pos.restaurant.menu.repository;

import com.pos.restaurant.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    List<MenuItem> findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(Integer companyId, Integer storeId);

    List<MenuItem> findByCompanyIdAndStoreIdAndActiveTrueAndAvailableTrueOrderBySortOrderAscNameAsc(
        Integer companyId,
        Integer storeId
    );

    Optional<MenuItem> findByIdAndCompanyId(UUID id, Integer companyId);

    List<MenuItem> findByMenuCategoryIdAndCompanyId(UUID menuCategoryId, Integer companyId);

    List<MenuItem> findByCompanyIdAndVariantGroupId(Integer companyId, UUID variantGroupId);

    List<MenuItem> findByCompanyIdAndVariantGroupIdIn(Integer companyId, Collection<UUID> variantGroupIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update MenuItem m
        set m.category = :name
        where m.menuCategoryId = :categoryId
          and m.companyId = :companyId
        """)
    int updateCategoryName(
        @Param("categoryId") UUID categoryId,
        @Param("companyId") Integer companyId,
        @Param("name") String name
    );
}
