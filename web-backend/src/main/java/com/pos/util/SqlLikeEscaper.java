package com.pos.util;

/**
 * Escapes {@code %}, {@code _} and {@code \} for SQL {@code LIKE … ESCAPE '\'}.
 */
public final class SqlLikeEscaper {

    private SqlLikeEscaper() {
    }

    public static String escape(String raw) {
        if (raw == null || raw.isEmpty()) {
            return raw;
        }
        return raw
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_");
    }
}
