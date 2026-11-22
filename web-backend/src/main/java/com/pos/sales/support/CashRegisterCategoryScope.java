package com.pos.sales.support;

import java.util.Collections;
import java.util.Set;

/**
 * Allowed category IDs for a POS session from {@code cash_register_configs}.
 * {@link #unrestricted()} = no matching config → show full company catalog.
 * Restricted with empty set = matching config with no categories → show none.
 */
public record CashRegisterCategoryScope(boolean restricted, Set<Integer> categoryIds) {

    public static CashRegisterCategoryScope unrestricted() {
        return new CashRegisterCategoryScope(false, Set.of());
    }

    public static CashRegisterCategoryScope of(Set<Integer> ids) {
        Set<Integer> copy = ids == null || ids.isEmpty()
            ? Set.of()
            : Set.copyOf(ids);
        return new CashRegisterCategoryScope(true, copy);
    }

    public boolean allows(Integer categoryId) {
        if (!restricted) {
            return true;
        }
        return categoryId != null && categoryIds.contains(categoryId);
    }

    public Set<Integer> allowedIdsOrEmpty() {
        return restricted ? categoryIds : Collections.emptySet();
    }
}
