package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.util.List;

/** Колонка устама/%: чистое число 0–1000, не серия и не текст единицы. */
public final class PharmacyImportMarkupLook {

    private static final BigDecimal MAX = new BigDecimal("1000");

    private PharmacyImportMarkupLook() {}

    public static boolean cell(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String text = raw.trim().replace('\u00a0', ' ');
        if (text.contains("%") && PharmacyImportRateLook.cell(text)) {
            return true;
        }
        if (!text.matches("[-+]?[0-9]+([.,][0-9]+)?")) {
            return false;
        }
        if (text.matches("0[0-9]+")) {
            return false;
        }
        BigDecimal value = PharmacyImportValueParser.decimal(text);
        return value != null
            && value.compareTo(BigDecimal.ZERO) >= 0
            && value.compareTo(MAX) <= 0;
    }

    public static boolean column(List<List<String>> rows, int index) {
        if (rows == null || index < 0) {
            return false;
        }
        int hits = 0;
        int seen = 0;
        for (List<String> row : rows) {
            if (row == null || index >= row.size()) {
                continue;
            }
            String cell = row.get(index);
            if (cell == null || cell.isBlank()) {
                continue;
            }
            seen++;
            if (cell(cell)) {
                hits++;
            }
            if (seen >= 8) {
                break;
            }
        }
        return seen > 0 && hits * 2 >= seen;
    }
}
