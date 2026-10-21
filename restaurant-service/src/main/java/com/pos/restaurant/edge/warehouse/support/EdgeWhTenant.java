package com.pos.restaurant.edge.warehouse.support;

import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhTenant {

    private final EdgeStoreRepository storeRepository;

    public Integer requireCompany() {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) throw new BusinessException("Company context required");
        return companyId;
    }

    public Integer firstStore(Integer companyId) {
        return storeRepository.findByCompanyIdAndActiveTrueOrderByNameAsc(companyId).stream()
            .map(EdgeStore::getId)
            .findFirst()
            .orElse(null);
    }

    public Integer resolveStore(Integer storeId, Integer companyId) {
        return storeId != null ? storeId : firstStore(companyId);
    }

    public String storeName(Integer storeId) {
        if (storeId == null) return null;
        return storeRepository.findById(storeId).map(EdgeStore::getName).orElse("Точка #" + storeId);
    }
}
