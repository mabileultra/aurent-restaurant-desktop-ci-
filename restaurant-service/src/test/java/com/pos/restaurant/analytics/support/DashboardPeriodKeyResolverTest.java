package com.pos.restaurant.analytics.support;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DashboardPeriodKeyResolverTest {

    private final DashboardPeriodKeyResolver resolver =
        new DashboardPeriodKeyResolver(new AnalyticsPeriodResolver());

    @Test
    void todayByDefault() {
        var period = resolver.resolve(null, null, null);
        assertTrue(period.to().isAfter(period.from()));
    }

    @Test
    void customUsesBounds() {
        Instant from = Instant.parse("2026-09-01T00:00:00Z");
        Instant to = Instant.parse("2026-09-02T00:00:00Z");
        var period = resolver.resolve("CUSTOM", from, to);
        assertEquals(from, period.from());
        assertEquals(to, period.to());
    }

    @Test
    void weekAlias() {
        var a = resolver.resolve("WEEK", null, null);
        var b = resolver.resolve("THIS_WEEK", null, null);
        assertEquals(a.from(), b.from());
        assertEquals(a.to(), b.to());
    }
}
