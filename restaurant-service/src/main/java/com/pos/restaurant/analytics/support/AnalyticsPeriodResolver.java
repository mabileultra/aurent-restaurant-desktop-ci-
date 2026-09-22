package com.pos.restaurant.analytics.support;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class AnalyticsPeriodResolver {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public record Period(Instant from, Instant to) {
    }

    public Period today() {
        LocalDate day = LocalDate.now(ZONE);
        ZonedDateTime start = day.atStartOfDay(ZONE);
        return new Period(start.toInstant(), start.plusDays(1).toInstant());
    }

    public Period yesterday() {
        LocalDate day = LocalDate.now(ZONE).minusDays(1);
        ZonedDateTime start = day.atStartOfDay(ZONE);
        return new Period(start.toInstant(), start.plusDays(1).toInstant());
    }

    public Period thisWeek() {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        ZonedDateTime start = monday.atStartOfDay(ZONE);
        ZonedDateTime end = today.plusDays(1).atStartOfDay(ZONE);
        return new Period(start.toInstant(), end.toInstant());
    }

    public Period thisMonth() {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate first = today.withDayOfMonth(1);
        ZonedDateTime start = first.atStartOfDay(ZONE);
        ZonedDateTime end = today.plusDays(1).atStartOfDay(ZONE);
        return new Period(start.toInstant(), end.toInstant());
    }

    public Period resolve(Instant from, Instant to) {
        if (from != null && to != null) {
            return new Period(from, to);
        }
        if (from != null) {
            return new Period(from, from.atZone(ZONE).toLocalDate().plusDays(1).atStartOfDay(ZONE).toInstant());
        }
        return today();
    }

    /** Equal-length window ending at {@code period.from()}. */
    public Period previousOf(Period period) {
        long millis = ChronoUnit.MILLIS.between(period.from(), period.to());
        if (millis <= 0) {
            return yesterday();
        }
        Instant to = period.from();
        Instant from = to.minusMillis(millis);
        return new Period(from, to);
    }
}
