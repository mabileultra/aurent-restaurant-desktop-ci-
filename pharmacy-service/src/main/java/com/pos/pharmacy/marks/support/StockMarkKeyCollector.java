package com.pos.pharmacy.marks.support;

import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

public final class StockMarkKeyCollector {

    private StockMarkKeyCollector() {}

    public static Set<String> collectKeys(Collection<String> markCodes) {
        Set<String> keys = new LinkedHashSet<>();
        if (markCodes == null) {
            return keys;
        }
        for (String code : markCodes) {
            if (!StringUtils.hasText(code)) {
                continue;
            }
            keys.addAll(StockMarkKeys.allKeys(code));
        }
        return keys;
    }
}
