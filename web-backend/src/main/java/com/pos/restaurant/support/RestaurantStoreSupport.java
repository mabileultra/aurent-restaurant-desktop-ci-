package com.pos.restaurant.support;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RestaurantStoreSupport {

    private final StoreRepository storeRepository;
    private final TenantAccessSupport tenantAccess;

    public Store requireRestaurantStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        tenantAccess.assertCanAccessStore(store);
        String type = BusinessTypeCodes.normalize(store.getBusinessType());
        if (!BusinessTypeCodes.RESTAURANT.equals(type)) {
            throw new BadRequestException("Store business type must be RESTAURANT");
        }
        return store;
    }

    public Store requireAccessibleStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        tenantAccess.assertCanAccessStore(store);
        return store;
    }
}
