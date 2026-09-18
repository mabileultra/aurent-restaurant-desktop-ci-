package com.pos.pharmacy.warehouse.support;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Парсинг колонки КМ в Excel: несколько кодов через ; , | или перевод строки. */
public final class PharmacyImportMarkCodesParser {

    private PharmacyImportMarkCodesParser() {
    }

    public static List<String> parse(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        String normalized = raw
            .replace('\u001d', ' ')
            .replace('€', ' ')
            .trim();
        String[] parts = normalized.split("[;|,\\n\\r]+");
        Set<String> unique = new LinkedHashSet<>();
        List<String> out = new ArrayList<>();
        for (String part : parts) {
            String code = part == null ? "" : part.trim();
            if (!StringUtils.hasText(code)) {
                continue;
            }
            String key = code.toLowerCase(Locale.ROOT);
            if (unique.add(key)) {
                out.add(code);
            }
        }
        return out;
    }
}
