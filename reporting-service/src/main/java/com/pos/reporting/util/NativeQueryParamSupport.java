package com.pos.reporting.util;

import jakarta.persistence.Query;

public final class NativeQueryParamSupport {

    private static final int OPTIONAL_INT_ABSENT = -1;

    private NativeQueryParamSupport() {
    }

    public static int optionalCategoryId(Integer categoryId) {
        return categoryId != null ? categoryId : OPTIONAL_INT_ABSENT;
    }

    public static int optionalStoreId(Integer storeId) {
        return storeId != null ? storeId : OPTIONAL_INT_ABSENT;
    }

    public static int booleanFlag(boolean value) {
        return value ? 1 : 0;
    }

    public static String normalizeSearch(String search) {
        return search == null || search.isBlank() ? "" : search.trim();
    }

    public static void bindOptionalCategoryId(Query query, String paramName, Integer categoryId) {
        query.setParameter(paramName, optionalCategoryId(categoryId));
    }

    public static void bindOptionalStoreId(Query query, String paramName, Integer storeId) {
        query.setParameter(paramName, optionalStoreId(storeId));
    }
}
