package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.dto.SaveMenuCategoryRequest;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.mapper.MenuCategoryMapper;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.support.MenuCategoryNameUniquenessValidator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class MenuCategoryCreateHandler {

    private final MenuCategoryRepository categoryRepository;
    private final MenuCategoryMapper categoryMapper;
    private final FloorTenantSupport tenantSupport;
    private final MenuCategoryNameUniquenessValidator nameUniquenessValidator;

    @Transactional
    public MenuCategoryResponse handle(Integer storeId, SaveMenuCategoryRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        String name = request.name().trim();
        nameUniquenessValidator.assertUniqueOnCreate(storeId, name);
        boolean autoPrint = Boolean.TRUE.equals(request.autoPrint());
        MenuCategory saved = categoryRepository.save(MenuCategory.builder()
            .companyId(companyId)
            .storeId(storeId)
            .name(name)
            .sortOrder(request.sortOrder() == null ? 100 : request.sortOrder())
            .active(true)
            .autoPrint(autoPrint)
            .printPrinterName(autoPrint ? requirePrinterName(request.printPrinterName()) : null)
            .build());
        LogUtil.info(MenuCategoryCreateHandler.class, "Menu category created: id={}, storeId={}", saved.getId(), storeId);
        return categoryMapper.toResponse(saved);
    }

    private static String requirePrinterName(String raw) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) {
            throw new BusinessException("Choose a printer for immediate printing");
        }
        return name;
    }
}
