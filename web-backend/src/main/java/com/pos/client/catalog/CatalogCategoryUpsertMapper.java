package com.pos.client.catalog;

import com.pos.catalog.entity.Category;
import com.pos.shared.catalog.CatalogLegacyIds;
import org.springframework.stereotype.Component;

@Component
public class CatalogCategoryUpsertMapper {

    public CatalogCategoryUpsertRequest toUpsert(Category category) {
        if (category == null || category.getId() == null || category.getCompany() == null) {
            return null;
        }
        Integer companyId = category.getCompany().getId();
        return new CatalogCategoryUpsertRequest(
            CatalogLegacyIds.categoryId(companyId, category.getId()),
            companyId,
            category.getName(),
            true,
            null
        );
    }
}
