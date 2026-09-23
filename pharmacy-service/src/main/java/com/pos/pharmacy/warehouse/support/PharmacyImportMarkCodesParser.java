package com.pos.pharmacy.warehouse.support;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Парсинг колонки КМ в Excel: несколько кодов через ; , | или перевод строки.
 * Флаг Didox «Маркировкаланган» и прочий текст без DataMatrix отбрасываем —
 * иначе ASL-журнал засоряется «Marking code is required».
 */
public final class PharmacyImportMarkCodesParser {

    /** Как у ASL: короче — не КМ идентификации. */
    private static final int MIN_CODE_LENGTH = 20;

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
            if (!isPlausibleMarkCode(code)) {
                continue;
            }
            String key = code.toLowerCase(Locale.ROOT);
            if (unique.add(key)) {
                out.add(code);
            }
        }
        return out;
    }

    /** Реальный КМ: не флаг фактуры, длина как у DataMatrix, есть цифры. */
    public static boolean isPlausibleMarkCode(String code) {
        if (!StringUtils.hasText(code)) {
            return false;
        }
        String trimmed = code.trim();
        if (PharmacyImportInvoiceMarkLook.flagCell(trimmed)) {
            return false;
        }
        if (trimmed.length() < MIN_CODE_LENGTH) {
            return false;
        }
        boolean hasDigit = false;
        for (int i = 0; i < trimmed.length(); i++) {
            if (Character.isDigit(trimmed.charAt(i))) {
                hasDigit = true;
                break;
            }
        }
        return hasDigit;
    }
}
