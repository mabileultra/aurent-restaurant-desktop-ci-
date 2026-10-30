package com.pos.taxanalytics.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaxAnalyticsWeekWindowTest {

    @Test
    void wednesdaySplitsCurrentPartialWeekFromPreviousFullWeek() {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.of(LocalDate.of(2026, 10, 28));
        assertEquals(LocalDate.of(2026, 10, 26), week.weekFrom());
        assertEquals(LocalDate.of(2026, 10, 28), week.weekTo());
        assertEquals(LocalDate.of(2026, 10, 19), week.prevWeekFrom());
        assertEquals(LocalDate.of(2026, 10, 25), week.prevWeekTo());
    }

    @Test
    void mondayStartsANewWeekAgainstThePreviousSunday() {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.of(LocalDate.of(2026, 10, 26));
        assertEquals(LocalDate.of(2026, 10, 26), week.weekFrom());
        assertEquals(LocalDate.of(2026, 10, 26), week.weekTo());
        assertEquals(LocalDate.of(2026, 10, 19), week.prevWeekFrom());
        assertEquals(LocalDate.of(2026, 10, 25), week.prevWeekTo());
    }
}
