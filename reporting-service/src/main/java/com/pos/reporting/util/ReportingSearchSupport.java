package com.pos.reporting.util;

import org.springframework.util.StringUtils;

/**
 * Нормализация search для JPQL/native LIKE.
 * Важно: никогда не передавать {@code null} в PostgreSQL CONCAT/'%'||?||'%' —
 * Hibernate биндит null так, что получается {@code lower(bytea)} → 500.
 */
public final class ReportingSearchSupport {

    private ReportingSearchSupport() {
    }

    /** Пустая строка вместо null — безопасно для {@code :search = ''} и CONCAT. */
    public static String normalizeLikePattern(String search) {
        if (!StringUtils.hasText(search)) {
            return "";
        }
        return search.trim();
    }

    /** Готовый паттерн {@code %query%} для {@code LIKE :searchPattern}. */
    public static String toContainsPattern(String search) {
        String normalized = normalizeLikePattern(search);
        if (normalized.isEmpty()) {
            return "";
        }
        return "%" + normalized + "%";
    }

    public static boolean hasSearch(String search) {
        return StringUtils.hasText(search);
    }
}
