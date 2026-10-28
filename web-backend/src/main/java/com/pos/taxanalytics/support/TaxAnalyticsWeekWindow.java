package com.pos.taxanalytics.support;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/** Calendar week Monday–Sunday in Asia/Tashkent. Current week ends today. */
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
        LocalDate weekFrom = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate prevWeekTo = weekFrom.minusDays(1);
        LocalDate prevWeekFrom = prevWeekTo.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return new TaxAnalyticsWeekWindow(weekFrom, today, prevWeekFrom, prevWeekTo);
    }
}
