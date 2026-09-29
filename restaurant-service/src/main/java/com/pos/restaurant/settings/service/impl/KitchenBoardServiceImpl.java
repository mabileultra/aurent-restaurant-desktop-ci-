package com.pos.restaurant.settings.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.settings.dto.KitchenBoardSettingsResponse;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.settings.service.KitchenBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class KitchenBoardServiceImpl implements KitchenBoardService {

    private final RestaurantStoreSettingRepository repository;
    private final FloorTenantSupport tenantSupport;

    @Override
    @Transactional(readOnly = true)
    public KitchenBoardSettingsResponse get(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return new KitchenBoardSettingsResponse(storeId, isEnabled(companyId, storeId));
    }

    @Override
    @Transactional
    public KitchenBoardSettingsResponse setEnabled(Integer storeId, boolean enabled) {
        Integer companyId = tenantSupport.requireCompanyId();
        RestaurantStoreSetting row = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .orElseGet(() -> RestaurantStoreSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .build());
        row.setKitchenBoardEnabled(enabled);
        repository.save(row);
        return new KitchenBoardSettingsResponse(storeId, enabled);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEnabled(Integer companyId, Integer storeId) {
        return repository.findByCompanyIdAndStoreId(companyId, storeId)
            .map(RestaurantStoreSetting::isKitchenBoardEnabled)
            .orElse(true);
    }
}
