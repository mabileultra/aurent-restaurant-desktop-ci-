package com.pos.restaurant.settings.service.impl;

import com.pos.restaurant.config.RestaurantCacheNames;
import com.pos.restaurant.config.RestaurantHotCache;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.settings.dto.ForeignTableOrderSettingsResponse;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.settings.service.ForeignTableOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ForeignTableOrderServiceImpl implements ForeignTableOrderService {

    private final RestaurantStoreSettingRepository repository;
    private final FloorTenantSupport tenantSupport;
    private final RestaurantHotCache hotCache;

    @Override
    @Transactional(readOnly = true)
    public ForeignTableOrderSettingsResponse get(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return new ForeignTableOrderSettingsResponse(storeId, isAllowed(companyId, storeId));
    }

    @Override
    @Transactional
    public ForeignTableOrderSettingsResponse setAllowed(Integer storeId, boolean allowed) {
        Integer companyId = tenantSupport.requireCompanyId();
        RestaurantStoreSetting row = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .orElseGet(() -> RestaurantStoreSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .build());
        row.setAllowForeignTableOrders(allowed);
        repository.save(row);
        hotCache.evictForeignTableOrders(companyId, storeId);
        return new ForeignTableOrderSettingsResponse(storeId, allowed);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RestaurantCacheNames.FOREIGN_TABLE_ORDERS, key = "#companyId + ':' + #storeId")
    public boolean isAllowed(Integer companyId, Integer storeId) {
        return repository.findByCompanyIdAndStoreId(companyId, storeId)
            .map(RestaurantStoreSetting::isAllowForeignTableOrders)
            .orElse(true);
    }
}
