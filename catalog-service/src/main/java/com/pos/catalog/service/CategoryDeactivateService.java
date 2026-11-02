package com.pos.catalog.service;

import com.pos.catalog.repository.CategoryRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryDeactivateService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public void deactivate(UUID id) {
        categoryRepository.findById(id).ifPresent(category -> {
            category.setActive(false);
            categoryRepository.save(category);
            LogUtil.info(
                CategoryDeactivateService.class,
                "catalog-service category deactivate id={} companyId={}",
                category.getId(),
                category.getCompanyId()
            );
        });
    }
}
