package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.dto.SaveMenuCategoryRequest;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuCategoryMapper;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.support.MenuCategoryNameUniquenessValidator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuCategoryUpdateHandler {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final MenuCategoryMapper categoryMapper;
    private final FloorTenantSupport tenantSupport;
    private final MenuCategoryNameUniquenessValidator nameUniquenessValidator;

    @Transactional
    public MenuCategoryResponse handle(UUID categoryId, SaveMenuCategoryRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuCategory category = categoryRepository.findByIdAndCompanyId(categoryId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu category not found: " + categoryId));
        String name = request.name().trim();
        nameUniquenessValidator.assertUniqueOnUpdate(category.getStoreId(), name, categoryId);
        boolean renamed = !name.equals(category.getName());
        category.setName(name);
        if (request.sortOrder() != null) {
            category.setSortOrder(request.sortOrder());
        }
        if (renamed) {
            List<MenuItem> items = itemRepository.findByMenuCategoryIdAndCompanyId(categoryId, companyId);
            for (MenuItem item : items) {
                item.setCategory(name);
            }
        }
        LogUtil.info(MenuCategoryUpdateHandler.class, "Menu category updated: id={}", categoryId);
        return categoryMapper.toResponse(category);
    }
}
