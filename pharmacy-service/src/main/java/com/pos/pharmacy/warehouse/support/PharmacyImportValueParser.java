package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.util.ProductImportParseUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class PharmacyImportValueParser {

    private static final List<DateTimeFormatter> DATES = List.of(
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("d.M.uuuu"),
        DateTimeFormatter.ofPattern("d.M.uu"),
        DateTimeFormatter.ofPattern("d/M/uuuu"),
        DateTimeFormatter.ofPattern("d-M-uuuu"),
        DateTimeFormatter.ofPattern("uuuu.M.d"),
        DateTimeFormatter.ofPattern("uuuu/M/d")
    );

    private PharmacyImportValueParser() {
    }

    public static BigDecimal decimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.replace('\u00a0', ' ')
            .replace('\u202f', ' ')
            .replaceAll("(?i)(so['’`]?m|сўм|сум|sum|uzs)", "")
            .replace("%", " ")
            .trim();
        String cleaned = text.replaceAll("[^0-9,.-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-") || cleaned.equals(".") || cleaned.equals(",")) {
            return null;
        }
        try {
            BigDecimal parsed = new BigDecimal(normalizeGrouped(cleaned));
            if (!PharmacyMoneyLimit.fitsImportDecimal(parsed)) {
                return null;
            }
            return parsed;
        } catch (NumberFormatException ex) {
            return ProductImportParseUtil.parseDecimalOpt(text)
                .filter(PharmacyMoneyLimit::fitsImportDecimal)
                .orElse(null);
        }
    }

    /** 12,500.50 и 12.500,50 не должны обнуляться из-за разделителя тысяч. */
    static String normalizeGrouped(String cleaned) {
        int lastComma = cleaned.lastIndexOf(',');
        int lastDot = cleaned.lastIndexOf('.');
        if (lastComma >= 0 && lastDot >= 0) {
            if (lastComma > lastDot) {
                return cleaned.replace(".", "").replace(',', '.');
            }
            return cleaned.replace(",", "");
        }
        if (count(cleaned, ',') > 1) {
            return cleaned.replace(",", "");
        }
        if (count(cleaned, '.') > 1) {
            return cleaned.replace(".", "");
        }
        if (lastComma >= 0) {
            return cleaned.replace(',', '.');
        }
        return cleaned;
    }

    private static int count(String value, char ch) {
        int n = 0;
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) == ch) {
                n++;
            }
        }
        return n;
    }

    public static LocalDate date(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.trim();
        for (DateTimeFormatter formatter : DATES) {
            try {
                return LocalDate.parse(text, formatter);
            } catch (DateTimeParseException ignored) {
                // next
            }
        }
        Optional<LocalDate> monthYear = parseMonthYear(text);
        return monthYear.orElse(null);
    }

    private static Optional<LocalDate> parseMonthYear(String text) {
        String[] parts = text.split("[./-]");
        if (parts.length != 2) {
            return Optional.empty();
        }
        try {
            int first = Integer.parseInt(parts[0].trim());
            int second = Integer.parseInt(parts[1].trim());
            if (first >= 1 && first <= 12 && second >= 1900) {
                return Optional.of(LocalDate.of(second, first, 1));
            }
            if (first >= 1 && first <= 12 && second < 100) {
                return Optional.of(LocalDate.of(2000 + second, first, 1));
            }
            if (first >= 1900 && second >= 1 && second <= 12) {
                return Optional.of(LocalDate.of(first, second, 1));
            }
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
        return Optional.empty();
    }

    public static String cell(List<String> row, Integer index) {
        if (index == null || index < 0 || row == null || index >= row.size()) {
            return "";
        }
        String value = row.get(index);
        return value == null ? "" : value.trim();
    }

    public static String norm(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
