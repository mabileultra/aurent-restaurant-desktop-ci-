package com.pos.catalog.service.product.support;

import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * GTIN-14 из КМ (DataMatrix), зеркало frontend {@code @aurent/shared-marking}.
 * Поиск/by-barcode не должны матчить сырую строку КМ целиком.
 */
public final class ProductMarkingGtinExtractor {

    private static final Pattern PAREN_01 = Pattern.compile("\\(01\\)(\\d{14})");
    private static final Pattern AI_01 = Pattern.compile("(?:^|[^0-9])01(\\d{14})");
    private static final Pattern LEADING_01 = Pattern.compile("^01(\\d{14})");

    private ProductMarkingGtinExtractor() {
    }

    /** Нормализация скана: AIM, GS/FNC1 (€ / ↔), мусор нулей. */
    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw
            .replace("\uFEFF", "")
            .trim()
            .replaceFirst("^]\\w{2}", "")
            .replace("\u001d", "")
            .replace("\u001e", "")
            .replace("\u0000", "")
            .replace("\u2194", "")
            .replace("€", "")
            .replace("¦", "")
            .replace("\u00a4", "")
            .trim();
    }

    /**
     * Эвристика КМ (не EAN-8/13, не голый ИКПУ 14–17 цифр).
     * Совпадает по смыслу с frontend {@code isMarkingCode}.
     */
    public static boolean looksLikeMarkingCode(String raw) {
        String code = normalize(raw);
        if (!StringUtils.hasText(code)) {
            return false;
        }
        String lower = code.toLowerCase().replace('ё', 'е');
        if (lower.startsWith("http://") || lower.startsWith("https://") || lower.contains("ofd.soliq.uz")) {
            return false;
        }
        if (lower.contains("маркировкаланган") || lower.contains("markirovkalangan")) {
            return false;
        }
        if (code.matches("\\d{14,17}")) {
            return false;
        }
        String source = String.valueOf(raw);
        if (source.contains("\u001d") || source.contains("€") || source.contains("\u2194")) {
            return true;
        }
        if (code.matches("\\d{8}") || code.matches("\\d{12,13}")) {
            return false;
        }
        if (code.matches(".*01\\d{14}21.*") || code.matches(".*\\(01\\)\\d{14}\\(21\\).*")) {
            return true;
        }
        if (code.length() >= 20 && code.matches(".*[A-Za-z].*") && code.matches(".*\\d.*")) {
            return true;
        }
        return code.length() >= 25 && code.matches(".*[A-Za-z0-9].*");
    }

    /** GTIN-14 из КМ или {@code null}. */
    public static String extractGtin14(String raw) {
        String code = normalize(raw);
        if (!StringUtils.hasText(code)) {
            return null;
        }

        Matcher paren = PAREN_01.matcher(code);
        if (paren.find()) {
            return paren.group(1);
        }

        Matcher ai = AI_01.matcher(code);
        if (ai.find()) {
            return ai.group(1);
        }

        Matcher leading = LEADING_01.matcher(code);
        if (leading.find()) {
            return leading.group(1);
        }

        // Сканер без AI 01: GTIN-14 + серия с буквами
        if (code.length() > 14 && code.substring(0, 14).matches("\\d{14}")
            && code.substring(14).matches(".*[A-Za-z].*")) {
            return code.substring(0, 14);
        }

        String digits = digitsOnly(code);
        if (digits.length() >= 8 && digits.length() <= 14) {
            return digits.length() == 14 ? digits : null;
        }
        if (digits.length() >= 16 && digits.startsWith("01")) {
            return digits.substring(2, 16);
        }
        Matcher embedded = Pattern.compile("01(\\d{14})").matcher(digits);
        if (embedded.find()) {
            return embedded.group(1);
        }
        return null;
    }

    /**
     * Блок/короб GTIN-14 (indicator 1–8) → потребительский EAN-13
     * (check digit другой, чем у pack GTIN).
     */
    public static String ean13FromPackGtin14(String gtin14) {
        String digits = digitsOnly(gtin14);
        if (digits.length() != 14) {
            return null;
        }
        int indicator = digits.charAt(0) - '0';
        if (indicator < 1 || indicator > 8) {
            return null;
        }
        String body12 = digits.substring(1, 13);
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int weight = ((11 - i) % 2 == 0) ? 3 : 1;
            sum += (body12.charAt(i) - '0') * weight;
        }
        int check = (10 - (sum % 10)) % 10;
        return body12 + check;
    }

    static String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch >= '0' && ch <= '9') {
                sb.append(ch);
            }
        }
        return sb.toString();
    }
}
