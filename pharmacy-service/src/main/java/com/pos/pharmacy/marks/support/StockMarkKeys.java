package com.pos.pharmacy.marks.support;

import com.pos.pharmacy.sales.support.PharmacyMarkIdentityKeys;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.Set;

/** Выбор канонического mark_key и набора ключей для поиска. */
public final class StockMarkKeys {

    private StockMarkKeys() {
    }

    public static Set<String> allKeys(String raw) {
        return PharmacyMarkIdentityKeys.keysOf(raw);
    }

    /** Предпочитаем gs1:…, иначе full:… */
    public static String primaryKey(String raw) {
        Set<String> keys = allKeys(raw);
        if (keys.isEmpty()) {
            return null;
        }
        for (String key : keys) {
            if (key.startsWith("gs1:")) {
                return key;
            }
        }
        return keys.iterator().next();
    }

    public static Set<String> collectAll(Iterable<String> rawCodes) {
        Set<String> keys = new LinkedHashSet<>();
        if (rawCodes == null) {
            return keys;
        }
        for (String raw : rawCodes) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            keys.addAll(allKeys(raw));
        }
        return keys;
    }
}
