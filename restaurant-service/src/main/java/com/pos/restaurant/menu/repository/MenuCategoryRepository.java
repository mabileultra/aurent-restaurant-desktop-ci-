package com.pos.restaurant.menu.repository;

import com.pos.restaurant.menu.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, UUID> {

    List<MenuCategory> findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(Integer companyId, Integer storeId);

    List<MenuCategory> findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
        Integer companyId,
        Integer storeId
    );

    Optional<MenuCategory> findByIdAndCompanyId(UUID id, Integer companyId);

    boolean existsByStoreIdAndNameIgnoreCaseAndActiveTrue(Integer storeId, String name);

    boolean existsByStoreIdAndNameIgnoreCaseAndActiveTrueAndIdNot(Integer storeId, String name, UUID id);
}
