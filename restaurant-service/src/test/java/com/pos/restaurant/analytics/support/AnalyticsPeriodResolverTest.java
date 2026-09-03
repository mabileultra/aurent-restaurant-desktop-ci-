package com.pos.restaurant.analytics.support;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnalyticsPeriodResolverTest {

    private final AnalyticsPeriodResolver resolver = new AnalyticsPeriodResolver();

    @Test
    void todayHasPositiveRange() {
        var period = resolver.today();
        assertTrue(period.to().isAfter(period.from()));
        assertEquals(24, ChronoUnit.HOURS.between(period.from(), period.to()));
    }

    @Test
    void resolveUsesProvidedBounds() {
        Instant from = Instant.parse("2026-09-01T00:00:00Z");
        Instant to = Instant.parse("2026-09-02T00:00:00Z");
        var period = resolver.resolve(from, to);
        assertEquals(from, period.from());
        assertEquals(to, period.to());
    }
}
