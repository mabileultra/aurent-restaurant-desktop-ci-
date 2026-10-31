package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.config.RestaurantHotCache;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.floor.support.StoreTenantSupport;
import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.dto.SaveMenuCategoryRequest;
import com.pos.restaurant.menu.mapper.MenuCategoryMapper;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.service.MenuCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuCategoryServiceImpl implements MenuCategoryService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuCategoryMapper categoryMapper;
    private final FloorTenantSupport tenantSupport;
    private final StoreTenantSupport storeTenantSupport;
    private final MenuCategoryCreateHandler createHandler;
    private final MenuCategoryUpdateHandler updateHandler;
    private final MenuCategoryDeactivateHandler deactivateHandler;
    private final RestaurantHotCache hotCache;

    @Override
    public List<MenuCategoryResponse> list(Integer storeId, boolean activeOnly) {
        storeTenantSupport.requireStore(storeId);
        Integer companyId = tenantSupport.requireCompanyId();
        var rows = activeOnly
            ? categoryRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(companyId, storeId)
            : categoryRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        return rows.stream().map(categoryMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public MenuCategoryResponse create(Integer storeId, SaveMenuCategoryRequest request) {
        MenuCategoryResponse created = createHandler.handle(storeId, request);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), storeId);
        return created;
    }

    @Override
    @Transactional
    public MenuCategoryResponse update(UUID categoryId, SaveMenuCategoryRequest request) {
        MenuCategoryResponse updated = updateHandler.handle(categoryId, request);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), updated.storeId());
        return updated;
    }

    @Override
    @Transactional
    public void deactivate(UUID categoryId) {
        Integer storeId = deactivateHandler.handle(categoryId);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), storeId);
    }
}
