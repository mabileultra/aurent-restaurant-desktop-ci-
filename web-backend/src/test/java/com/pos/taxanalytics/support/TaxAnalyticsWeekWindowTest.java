package com.pos.taxanalytics.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaxAnalyticsWeekWindowTest {

    @Test
    void rollingSevenDaysOnWednesday() {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.of(LocalDate.of(2026, 10, 28));
        assertEquals(LocalDate.of(2026, 10, 22), week.weekFrom());
        assertEquals(LocalDate.of(2026, 10, 28), week.weekTo());
        assertEquals(LocalDate.of(2026, 10, 15), week.prevWeekFrom());
        assertEquals(LocalDate.of(2026, 10, 21), week.prevWeekTo());
    }

    @Test
    void rollingSevenDaysOnMondayDoesNotCompareOneDayToSeven() {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.of(LocalDate.of(2026, 11, 9));
        assertEquals(LocalDate.of(2026, 11, 3), week.weekFrom());
        assertEquals(LocalDate.of(2026, 11, 9), week.weekTo());
        assertEquals(LocalDate.of(2026, 10, 27), week.prevWeekFrom());
        assertEquals(LocalDate.of(2026, 11, 2), week.prevWeekTo());
    }
}
