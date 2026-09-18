package com.pos.pharmacy.catalog.support;

/** Фильтр списка аптечных товаров: все / активные / удалённые. */
public final class ProductListScope {

    public static final String ALL = "ALL";
    public static final String ACTIVE = "ACTIVE";
    public static final String DELETED = "DELETED";

    private ProductListScope() {}

    public static String normalize(String scope, boolean activeOnly) {
        if (scope != null && !scope.isBlank()) {
            String value = scope.trim().toUpperCase();
            if (ACTIVE.equals(value) || DELETED.equals(value) || ALL.equals(value)) {
                return value;
            }
        }
        return activeOnly ? ACTIVE : ALL;
    }

    /** {@code null} — все; {@code true} — только активные; {@code false} — только удалённые. */
    public static Boolean activeFilter(String scope, boolean activeOnly) {
        String normalized = normalize(scope, activeOnly);
        if (ACTIVE.equals(normalized)) {
            return Boolean.TRUE;
        }
        if (DELETED.equals(normalized)) {
            return Boolean.FALSE;
        }
        return null;
    }
}
