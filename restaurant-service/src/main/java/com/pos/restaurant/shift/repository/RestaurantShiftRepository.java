package com.pos.restaurant.shift.repository;

import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantShiftRepository extends JpaRepository<RestaurantShift, UUID> {

    Optional<RestaurantShift> findByStoreIdAndStatus(Integer storeId, RestaurantShiftStatus status);

    List<RestaurantShift> findByCompanyIdAndStoreIdOrderByOpenedAtDesc(Integer companyId, Integer storeId);

    boolean existsByStoreIdAndStatus(Integer storeId, RestaurantShiftStatus status);

    Optional<RestaurantShift> findFirstByCompanyIdAndStoreIdAndStatusOrderByClosedAtDesc(
        Integer companyId,
        Integer storeId,
        RestaurantShiftStatus status
    );
}
