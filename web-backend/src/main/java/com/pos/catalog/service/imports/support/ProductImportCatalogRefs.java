package com.pos.catalog.service.imports.support;

import com.pos.catalog.repository.CategoryRepository;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Резолв категории/магазина импорта с проверкой tenant. */
@Component
@RequiredArgsConstructor
public class ProductImportCatalogRefs {

    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final TenantAccessSupport tenantAccess;

    public Integer resolveCategoryId(Integer categoryId, String context) {
        if (categoryId == null) {
            return null;
        }
        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new BadRequestException(context + ": категория не найдена"));
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (category.getCompany() == null || !category.getCompany().getId().equals(companyId)) {
            throw new BadRequestException(context + ": категория не принадлежит вашей компании");
        }
        return categoryId;
    }

    public Integer resolveStoreId(Integer storeId, String context) {
        if (storeId == null) {
            return null;
        }
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException(context + ": магазин не найден"));
        tenantAccess.assertCanAccessStore(store);
        if (!store.isActive()) {
            throw new BadRequestException(context + ": магазин неактивен");
        }
        return storeId;
    }
}
