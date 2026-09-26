package com.pos.restaurant.menu.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuCategoryNameUniquenessValidator {

    private final MenuCategoryRepository categoryRepository;

    public void assertUniqueOnCreate(Integer storeId, String name) {
        if (categoryRepository.existsByStoreIdAndNameIgnoreCaseAndActiveTrue(storeId, name)) {
            throw new BusinessException("Menu category already exists: " + name);
        }
    }

    public void assertUniqueOnUpdate(Integer storeId, String name, UUID id) {
        if (categoryRepository.existsByStoreIdAndNameIgnoreCaseAndActiveTrueAndIdNot(storeId, name, id)) {
            throw new BusinessException("Menu category already exists: " + name);
        }
    }
}
