package com.pos.catalog.service;

import com.pos.catalog.dto.UpsertCategoryRequest;
import com.pos.catalog.entity.Category;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryUpsertService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public void upsert(UpsertCategoryRequest req) {
        UUID id = req.id();
        Category category = categoryRepository.findById(id).orElseGet(() -> {
            Category created = new Category();
            created.setId(id);
            created.setCompanyId(req.companyId());
            return created;
        });
        if (category.getCompanyId() != null && !category.getCompanyId().equals(req.companyId())) {
            throw CatalogExceptions.conflict("Категория принадлежит другой компании");
        }
        category.setCompanyId(req.companyId());
        category.setName(req.name().trim());
        category.setActive(req.active() == null || req.active());
        if (req.sortOrder() != null) {
            category.setSortOrder(req.sortOrder());
        }
        categoryRepository.save(category);
        LogUtil.info(
            CategoryUpsertService.class,
            "catalog-service category upsert id={} companyId={} active={}",
            category.getId(),
            category.getCompanyId(),
            category.isActive()
        );
    }
}
