package com.pos.ai.support;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Utility for Tashkent timezone date operations.
 */
public final class TashkentPeriod {

    public static final ZoneId TASHKENT = ZoneId.of("Asia/Tashkent");

    private TashkentPeriod() {}

    public static LocalDate today() {
        return ZonedDateTime.now(TASHKENT).toLocalDate();
    }

    public static LocalDate yesterday() {
        return today().minusDays(1);
    }

    public static LocalDate startOfMonth() {
        return today().withDayOfMonth(1);
    }

    public static LocalDate startOfYear() {
        return today().withDayOfYear(1);
    }

    public static LocalDate startOfWeek() {
        LocalDate today = today();
        return today.minusDays(today.getDayOfWeek().getValue() - 1);
    }
}
