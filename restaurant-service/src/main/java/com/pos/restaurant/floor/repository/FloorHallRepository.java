package com.pos.restaurant.floor.repository;

import com.pos.restaurant.floor.entity.FloorHall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorHallRepository extends JpaRepository<FloorHall, Integer> {

    List<FloorHall> findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(Integer companyId, Integer storeId);

    List<FloorHall> findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
        Integer companyId,
        Integer storeId
    );

    Optional<FloorHall> findByIdAndCompanyId(Integer id, Integer companyId);

    boolean existsByCompanyIdAndStoreIdAndNameIgnoreCaseAndActiveTrueAndIdNot(
        Integer companyId,
        Integer storeId,
        String name,
        Integer id
    );

    boolean existsByCompanyIdAndStoreIdAndNameIgnoreCaseAndActiveTrue(
        Integer companyId,
        Integer storeId,
        String name
    );
}
