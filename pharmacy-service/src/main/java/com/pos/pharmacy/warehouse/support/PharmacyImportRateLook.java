package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.util.List;

/** Ячейка ставки НДС: «12%», не сумма 10 605. */
public final class PharmacyImportRateLook {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private PharmacyImportRateLook() {}

    public static boolean cell(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String text = raw.trim();
        if (!text.contains("%")) {
            return false;
        }
        BigDecimal value = PharmacyImportValueParser.decimal(text);
        return value != null
            && value.compareTo(BigDecimal.ZERO) >= 0
            && value.compareTo(HUNDRED) <= 0;
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
