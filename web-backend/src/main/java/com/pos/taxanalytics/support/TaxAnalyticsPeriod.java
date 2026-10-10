package com.pos.taxanalytics.support;

import com.pos.exception.PosExceptions;

import java.time.LocalDate;
import java.time.ZoneId;

public record TaxAnalyticsPeriod(LocalDate from, LocalDate to, LocalDate prevFrom, LocalDate prevTo, String key) {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public static TaxAnalyticsPeriod resolve(String period, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZONE);
        String key = period == null || period.isBlank() ? "30d" : period.trim().toLowerCase();
        LocalDate start;
        LocalDate end;
        switch (key) {
            case "today" -> {
                start = today;
                end = today;
            }
            case "7d" -> {
                end = today;
                start = today.minusDays(6);
            }
            case "30d" -> {
                end = today;
                start = today.minusDays(29);
            }
            case "month" -> {
                start = today.withDayOfMonth(1);
                end = today;
            }
            case "year" -> {
                start = today.withDayOfYear(1);
                end = today;
            }
            case "custom" -> {
                if (from == null || to == null) {
                    // Incomplete UI date range — fall back instead of 400.
                    end = today;
                    start = today.minusDays(29);
                    key = "30d";
                } else if (to.isBefore(from)) {
                    throw PosExceptions.badRequest("Period to must be >= from");
                } else {
                    start = from;
                    end = to;
                }
            }
            default -> {
                end = today;
                start = today.minusDays(29);
                key = "30d";
            }
        }
        long days = end.toEpochDay() - start.toEpochDay() + 1;
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days - 1);
        return new TaxAnalyticsPeriod(start, end, prevStart, prevEnd, key);
    }
}
