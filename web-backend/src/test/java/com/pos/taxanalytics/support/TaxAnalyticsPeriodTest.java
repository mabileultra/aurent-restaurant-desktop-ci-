package com.pos.taxanalytics.support;

import com.pos.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TaxAnalyticsPeriodTest {

    @Test
    void incompleteCustomFallsBackTo30d() {
        TaxAnalyticsPeriod p = TaxAnalyticsPeriod.resolve("custom", null, null);
        assertEquals("30d", p.key());
        assertEquals(29, p.to().toEpochDay() - p.from().toEpochDay());
    }

    @Test
    void customRange() {
        LocalDate from = LocalDate.of(2024, 8, 1);
        LocalDate to = LocalDate.of(2024, 8, 31);
        TaxAnalyticsPeriod p = TaxAnalyticsPeriod.resolve("custom", from, to);
        assertEquals("custom", p.key());
        assertEquals(from, p.from());
        assertEquals(to, p.to());
        assertEquals(LocalDate.of(2024, 7, 1), p.prevFrom());
        assertEquals(LocalDate.of(2024, 7, 31), p.prevTo());
    }

    @Test
    void rejectsInvertedRange() {
        assertThrows(
            BadRequestException.class,
            () -> TaxAnalyticsPeriod.resolve("custom", LocalDate.of(2024, 8, 31), LocalDate.of(2024, 8, 1))
        );
    }
}
