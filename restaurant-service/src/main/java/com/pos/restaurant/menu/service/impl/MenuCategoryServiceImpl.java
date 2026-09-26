package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
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
    private final MenuCategoryCreateHandler createHandler;
    private final MenuCategoryUpdateHandler updateHandler;
    private final MenuCategoryDeactivateHandler deactivateHandler;

    @Override
    public List<MenuCategoryResponse> list(Integer storeId, boolean activeOnly) {
        Integer companyId = tenantSupport.requireCompanyId();
        var rows = activeOnly
            ? categoryRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(companyId, storeId)
            : categoryRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        return rows.stream().map(categoryMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public MenuCategoryResponse create(Integer storeId, SaveMenuCategoryRequest request) {
        return createHandler.handle(storeId, request);
    }

    @Override
    @Transactional
    public MenuCategoryResponse update(UUID categoryId, SaveMenuCategoryRequest request) {
        return updateHandler.handle(categoryId, request);
    }

    @Override
    @Transactional
    public void deactivate(UUID categoryId) {
        deactivateHandler.handle(categoryId);
    }
}
