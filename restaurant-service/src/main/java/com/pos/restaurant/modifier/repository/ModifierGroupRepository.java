package com.pos.restaurant.modifier.repository;

import com.pos.restaurant.modifier.entity.ModifierGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModifierGroupRepository extends JpaRepository<ModifierGroup, UUID> {

    List<ModifierGroup> findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(Integer companyId, Integer storeId);

    Optional<ModifierGroup> findByIdAndCompanyId(UUID id, Integer companyId);

    List<ModifierGroup> findByIdInAndCompanyIdAndStoreIdAndActiveTrue(
        List<UUID> ids,
        Integer companyId,
        Integer storeId
    );
}
