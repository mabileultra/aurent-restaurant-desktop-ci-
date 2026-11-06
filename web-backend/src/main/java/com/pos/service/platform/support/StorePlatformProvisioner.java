package com.pos.service.platform.support;

import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.restaurant.support.RestaurantStoreMirrorNotifier;
import com.pos.mapper.StoreMapper;
import com.pos.repository.StoreRepository;
import com.pos.service.businessconfig.support.StoreBusinessTypeResolver;
import com.pos.service.support.GeoLocationSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class StorePlatformProvisioner {

    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;
    private final TenantAccessSupport tenantAccess;
    private final GeoLocationSupport geoLocationSupport;
    private final StoreBusinessTypeResolver storeBusinessTypeResolver;
    private final RestaurantStoreMirrorNotifier restaurantStoreMirrorNotifier;

    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public StoreResponse create(CreateStoreRequest request) {
        if (request == null || request.companyId() == null) {
            throw PosExceptions.badRequest("companyId is required");
        }
        Company company = tenantAccess.requireCompany(request.companyId());
        BusinessTypeDefinition businessTypeDefinition = storeBusinessTypeResolver.resolveForCreate(
            company,
            request.businessTypeId(),
            request.businessType()
        );
        String regionCode = geoLocationSupport.requireRegionCode(request.regionCode());
        String districtCode = geoLocationSupport.requireDistrictCode(regionCode, request.districtCode());
        Store saved = storeRepository.save(Store.builder()
            .name(request.name().trim())
            .code(TextUtil.trimOrNull(request.code()))
            .address(TextUtil.trimOrNull(request.address()))
            .regionCode(regionCode)
            .districtCode(districtCode)
            .phone(TextUtil.trimOrNull(request.phone()))
            .company(company)
            .businessTypeDefinition(businessTypeDefinition)
            .businessType(storeBusinessTypeResolver.codeFromDefinition(businessTypeDefinition))
            .active(request.active() == null || request.active())
            .build());
        restaurantStoreMirrorNotifier.afterSave(saved);
        LogUtil.info(StorePlatformProvisioner.class, "Platform store created: id={}, companyId={}", saved.getId(), company.getId());
        return storeMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public void delete(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        storeRepository.delete(store);
        LogUtil.info(StorePlatformProvisioner.class, "Platform store deleted: id={}", storeId);
    }
}
