package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportBatchExpiryTest {

    @Test
    void parsesCompactMonthYearSeries() {
        assertEquals(LocalDate.of(2026, 7, 1), PharmacyImportBatchExpiry.fromBatch("072026").orElseThrow());
        assertEquals(LocalDate.of(2026, 4, 1), PharmacyImportBatchExpiry.fromBatch("010426").orElseThrow());
        assertEquals(LocalDate.of(2025, 11, 1), PharmacyImportBatchExpiry.fromBatch("112025").orElseThrow());
        assertTrue(PharmacyImportBatchExpiry.fromBatch("DH5511").isEmpty());
        assertTrue(PharmacyImportBatchExpiry.fromBatch("2312026").isEmpty());
    }
}
