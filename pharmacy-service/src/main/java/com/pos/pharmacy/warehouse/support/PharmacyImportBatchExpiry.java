package com.pos.pharmacy.warehouse.support;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Серия вида 072026 (MMyyyy) или 010426 (ddMMyy) → срок, если колонки срока нет.
 */
public final class PharmacyImportBatchExpiry {

    private PharmacyImportBatchExpiry() {}

    public static Optional<LocalDate> fromBatch(String batch) {
        if (batch == null) {
            return Optional.empty();
        }
        String text = batch.trim().replaceAll("\\s+", "");
        if (!text.matches("\\d{6}")) {
            return Optional.empty();
        }
        int left = Integer.parseInt(text.substring(0, 2));
        int year4 = Integer.parseInt(text.substring(2, 6));
        if (year4 >= 2000 && year4 <= 2100 && left >= 1 && left <= 12) {
            return Optional.of(LocalDate.of(year4, left, 1));
        }
        int day = left;
        int month = Integer.parseInt(text.substring(2, 4));
        int year = 2000 + Integer.parseInt(text.substring(4, 6));
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
            int safeDay = Math.min(day, LocalDate.of(year, month, 1).lengthOfMonth());
            return Optional.of(LocalDate.of(year, month, safeDay));
        }
        return Optional.empty();
    }
}
