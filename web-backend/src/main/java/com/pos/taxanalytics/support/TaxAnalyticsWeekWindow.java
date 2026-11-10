package com.pos.taxanalytics.support;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Rolling 7-day windows in Asia/Tashkent.
 * Current = today-6..today; previous = the 7 days before that.
 * Avoids Monday comparing 1 partial day against a full prior calendar week.
 */
public record TaxAnalyticsWeekWindow(
    LocalDate weekFrom,
    LocalDate weekTo,
    LocalDate prevWeekFrom,
    LocalDate prevWeekTo
) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public static TaxAnalyticsWeekWindow current() {
        return of(LocalDate.now(ZONE));
    }

    public static TaxAnalyticsWeekWindow of(LocalDate today) {
        LocalDate weekTo = today;
        LocalDate weekFrom = today.minusDays(6);
        LocalDate prevWeekTo = weekFrom.minusDays(1);
        LocalDate prevWeekFrom = prevWeekTo.minusDays(6);
        return new TaxAnalyticsWeekWindow(weekFrom, weekTo, prevWeekFrom, prevWeekTo);
    }
}
