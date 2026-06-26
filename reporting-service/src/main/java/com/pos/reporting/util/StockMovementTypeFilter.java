package com.pos.reporting.util;

import org.springframework.util.StringUtils;

import java.util.Locale;

public final class StockMovementTypeFilter {

    private StockMovementTypeFilter() {
    }

    public static String normalize(String movementType) {
        if (!StringUtils.hasText(movementType) || "ALL".equalsIgnoreCase(movementType.trim())) {
            return null;
        }
        return movementType.trim().toUpperCase(Locale.ROOT);
    }
}
