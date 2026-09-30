package com.pos.restaurant.kitchen.repository;

import com.pos.restaurant.kitchen.entity.KitchenStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KitchenStationRepository extends JpaRepository<KitchenStation, UUID> {

    List<KitchenStation> findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(Integer companyId, Integer storeId);

    List<KitchenStation> findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
        Integer companyId,
        Integer storeId
    );

    List<KitchenStation> findByIdInAndCompanyId(java.util.Collection<UUID> ids, Integer companyId);

    Optional<KitchenStation> findByIdAndCompanyId(UUID id, Integer companyId);

    boolean existsByStoreIdAndCodeIgnoreCaseAndActiveTrue(Integer storeId, String code);

    boolean existsByStoreIdAndCodeIgnoreCaseAndActiveTrueAndIdNot(Integer storeId, String code, UUID id);
}
