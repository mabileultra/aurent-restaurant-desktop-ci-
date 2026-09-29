package com.pos.restaurant.settings.repository;

import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RestaurantStoreSettingRepository extends JpaRepository<RestaurantStoreSetting, UUID> {

    Optional<RestaurantStoreSetting> findByCompanyIdAndStoreId(Integer companyId, Integer storeId);
}
