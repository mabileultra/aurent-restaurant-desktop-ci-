package com.pos.domain;

import java.util.Set;

public enum ExpenseReason {
    INTERNAL_USE,
    STAFF_MEALS,
    HOUSEHOLD,
    DEPARTMENT,
    OTHER;

    private static final Set<String> KEYS = Set.of(
        "INTERNAL_USE", "STAFF_MEALS", "HOUSEHOLD", "DEPARTMENT", "OTHER"
    );

    public static ExpenseReason parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return OTHER;
        }
        String key = raw.trim().toUpperCase();
        if (!KEYS.contains(key)) {
            throw new IllegalArgumentException("Unknown expense reason: " + raw);
        }
        return ExpenseReason.valueOf(key);
    }
}
