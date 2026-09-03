package com.pos.restaurant.analytics.support;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

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

    public Period resolve(Instant from, Instant to) {
        if (from != null && to != null) {
            return new Period(from, to);
        }
        if (from != null) {
            return new Period(from, from.atZone(ZONE).toLocalDate().plusDays(1).atStartOfDay(ZONE).toInstant());
        }
        return today();
    }
}
