package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.floor.support.StoreTenantSupport;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuCategoryDeactivateHandler {

    private final MenuCategoryRepository categoryRepository;
    private final FloorTenantSupport tenantSupport;
    private final StoreTenantSupport storeTenantSupport;

    /** @return storeId for menu cache eviction */
    @Transactional
    public Integer handle(UUID categoryId) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuCategory category = categoryRepository.findByIdAndCompanyId(categoryId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu category not found: " + categoryId));
        storeTenantSupport.requireStore(companyId, category.getStoreId());
        category.setActive(false);
        LogUtil.info(MenuCategoryDeactivateHandler.class, "Menu category deactivated: id={}", categoryId);
        return category.getStoreId();
    }
}
