package com.pos.restaurant.menu.repository;

import com.pos.restaurant.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
