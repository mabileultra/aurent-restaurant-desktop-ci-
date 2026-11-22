package com.pos.catalog.repository.spec;

import com.pos.catalog.entity.Product;
import com.pos.sales.support.CashRegisterCategoryScope;
import org.springframework.data.jpa.domain.Specification;

/**
 * Restrict grocery catalog rows to categories allowed by cash-register config.
 */
public final class ProductCategoryScopeSpecifications {

    private ProductCategoryScopeSpecifications() {
    }

    public static Specification<Product> within(CashRegisterCategoryScope scope) {
        if (scope == null || !scope.restricted()) {
            return (root, query, cb) -> cb.conjunction();
        }
        if (scope.categoryIds().isEmpty()) {
            return (root, query, cb) -> cb.disjunction();
        }
        return (root, query, cb) -> root.get("category").get("id").in(scope.categoryIds());
    }
}
