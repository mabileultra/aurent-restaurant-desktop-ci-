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
        return ProductImportParseUtil.parseDecimalOpt(raw).orElse(null);
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
