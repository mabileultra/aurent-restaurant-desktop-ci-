package com.pos.reporting.util;

import jakarta.persistence.Parameter;
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

    /** LIKE-паттерн {@code %q%} без null — не использовать CONCAT('%', :search, '%') в SQL. */
    public static String toContainsPattern(String search) {
        String normalized = normalizeSearch(search);
        return normalized.isEmpty() ? "" : "%" + normalized + "%";
    }

    public static void bindOptionalCategoryId(Query query, String paramName, Integer categoryId) {
        setParameterIfPresent(query, paramName, optionalCategoryId(categoryId));
    }

    public static void bindOptionalStoreId(Query query, String paramName, Integer storeId) {
        setParameterIfPresent(query, paramName, optionalStoreId(storeId));
    }

    /**
     * Page и count SQL часто делят один binder — параметры только page-запроса
     * (например {@code asOfDate}) не должны ломать count.
     */
    public static void setParameterIfPresent(Query query, String name, Object value) {
        for (Parameter<?> parameter : query.getParameters()) {
            if (name.equals(parameter.getName())) {
                query.setParameter(name, value);
                return;
            }
        }
    }
}
