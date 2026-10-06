package com.pos.reporting.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Период платформенной аналитики. */
public record PlatformAnalyticsPeriod(
    String key,
    LocalDate from,
    LocalDate to,
    LocalDate prevFrom,
    LocalDate prevTo
) {
    public static PlatformAnalyticsPeriod resolve(String period, LocalDate from, LocalDate to, LocalDate today) {
        LocalDate end = today != null ? today : LocalDate.now();
        String key = period == null || period.isBlank() ? "7d" : period.trim().toLowerCase();
        LocalDate start;
        switch (key) {
            case "today" -> start = end;
            case "30d" -> start = end.minusDays(29);
            case "month" -> start = end.withDayOfMonth(1);
            case "year" -> start = end.withDayOfYear(1);
            case "custom" -> {
                if (from == null || to == null) {
                    throw new IllegalArgumentException("custom period requires from and to");
                }
                if (to.isBefore(from)) {
                    throw new IllegalArgumentException("to must be on or after from");
                }
                long days = ChronoUnit.DAYS.between(from, to) + 1;
                return new PlatformAnalyticsPeriod(
                    "custom",
                    from,
                    to,
                    from.minusDays(days),
                    from.minusDays(1)
                );
            }
            default -> {
                key = "7d";
                start = end.minusDays(6);
            }
        }
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return new PlatformAnalyticsPeriod(
            key,
            start,
            end,
            start.minusDays(days),
            start.minusDays(1)
        );
    }
}
