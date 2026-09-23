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

    /** Как у ASL / FE: короче — не КИ DataMatrix. */
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

    /**
     * Реальный КМ (DataMatrix), не флаг «Маркировкаланган» и не ИКПУ/МХИК (14–17 цифр).
     * Согласовано с {@code isPharmacyMarkingCode} на кассе.
     */
    public static boolean isPlausibleMarkCode(String code) {
        if (!StringUtils.hasText(code)) {
            return false;
        }
        String trimmed = code.trim();
        if (PharmacyImportInvoiceMarkLook.flagCell(trimmed)) {
            return false;
        }
        // ИКПУ/МХИК — только цифры, без AI 21 / криптохвоста
        if (trimmed.matches("\\d{14,17}")) {
            return false;
        }
        if (trimmed.length() < MIN_CODE_LENGTH) {
            return false;
        }
        boolean hasDigit = false;
        boolean hasLetter = false;
        for (int i = 0; i < trimmed.length(); i++) {
            char ch = trimmed.charAt(i);
            if (Character.isDigit(ch)) {
                hasDigit = true;
            } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
                hasLetter = true;
            }
        }
        if (!hasDigit) {
            return false;
        }
        // GS1 КМ: 01+GTIN+21… или длинный код с латиницей (серия/крипто)
        if (trimmed.matches("(?s).*01\\d{14}21.*") || trimmed.matches("(?s).*\\(01\\)\\d{14}\\(21\\).*")) {
            return true;
        }
        return hasLetter;
    }
}
