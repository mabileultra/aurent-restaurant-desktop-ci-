package com.pos.restaurant.settings.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.settings.dto.MenuPhotoSettingsResponse;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.settings.service.MenuPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MenuPhotoServiceImpl implements MenuPhotoService {

    private final RestaurantStoreSettingRepository repository;
    private final FloorTenantSupport tenantSupport;

    @Override
    @Transactional(readOnly = true)
    public MenuPhotoSettingsResponse get(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        boolean enabled = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .map(RestaurantStoreSetting::isMenuPhotosEnabled)
            .orElse(true);
        return new MenuPhotoSettingsResponse(storeId, enabled);
    }

    @Override
    @Transactional
    public MenuPhotoSettingsResponse setEnabled(Integer storeId, boolean enabled) {
        Integer companyId = tenantSupport.requireCompanyId();
        RestaurantStoreSetting row = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .orElseGet(() -> RestaurantStoreSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .build());
        row.setMenuPhotosEnabled(enabled);
        repository.save(row);
        return new MenuPhotoSettingsResponse(storeId, enabled);
    }
}
