package com.pos.pharmacy.warehouse.support;

import java.util.List;
import java.util.Locale;

/** Серия vs единица: «ZA4485», не «qadoq + dona». */
public final class PharmacyImportBatchLook {

    private PharmacyImportBatchLook() {}

    public static boolean unitCell(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String text = raw.toLowerCase(Locale.ROOT);
        return text.contains("dona") || text.contains("дона")
            || text.contains("qadoq") || text.contains("blister")
            || text.contains("flakon") || text.contains("упак");
    }

    public static boolean seriesCell(String raw) {
        if (raw == null || raw.isBlank() || unitCell(raw)) {
            return false;
        }
        String text = raw.trim();
        if (text.length() > 24) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("рецепт") || lower.contains("retsept")) {
            return false;
        }
        return text.chars().anyMatch(Character::isDigit);
    }

    public static boolean unitColumn(List<List<String>> rows, int index) {
        return majority(rows, index, PharmacyImportBatchLook::unitCell);
    }

    public static boolean seriesColumn(List<List<String>> rows, int index) {
        return majority(rows, index, PharmacyImportBatchLook::seriesCell);
    }

    private static boolean majority(List<List<String>> rows, int index, java.util.function.Predicate<String> test) {
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
            if (test.test(cell)) {
                hits++;
            }
            if (seen >= 8) {
                break;
            }
        }
        return seen > 0 && hits * 2 >= seen;
    }
}
