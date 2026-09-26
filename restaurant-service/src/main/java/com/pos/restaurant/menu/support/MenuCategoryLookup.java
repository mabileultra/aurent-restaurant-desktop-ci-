package com.pos.restaurant.menu.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuCategoryLookup {

    private final MenuCategoryRepository categoryRepository;

    public MenuCategory requireActive(UUID categoryId, Integer companyId, Integer storeId) {
        MenuCategory category = categoryRepository.findByIdAndCompanyId(categoryId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu category not found: " + categoryId));
        if (!category.getStoreId().equals(storeId) || !category.isActive()) {
            throw new BusinessException("Menu category is not available in this restaurant");
        }
        return category;
    }

    /** Resolve optional FK; returns null id + null name when cleared. */
    public Resolved resolveOptional(UUID categoryId, Integer companyId, Integer storeId) {
        if (categoryId == null) {
            return Resolved.empty();
        }
        MenuCategory category = requireActive(categoryId, companyId, storeId);
        return new Resolved(category.getId(), category.getName());
    }

    public record Resolved(UUID id, String name) {
        public static Resolved empty() {
            return new Resolved(null, null);
        }
    }
}
