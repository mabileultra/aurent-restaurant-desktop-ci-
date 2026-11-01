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
        var resolved = resolver.resolve(null, null, null);
        assertEquals("TODAY", resolved.key());
        assertTrue(resolved.period().to().isAfter(resolved.period().from()));
    }

    @Test
    void customUsesBounds() {
        Instant from = Instant.parse("2026-09-01T00:00:00Z");
        Instant to = Instant.parse("2026-09-02T00:00:00Z");
        var resolved = resolver.resolve("CUSTOM", from, to);
        assertEquals("CUSTOM", resolved.key());
        assertEquals(from, resolved.period().from());
        assertEquals(to, resolved.period().to());
    }

    @Test
    void weekAlias() {
        var a = resolver.resolve("WEEK", null, null);
        var b = resolver.resolve("THIS_WEEK", null, null);
        assertEquals("WEEK", a.key());
        assertEquals("WEEK", b.key());
        assertEquals(a.period().from(), b.period().from());
        assertEquals(a.period().to(), b.period().to());
    }

    @Test
    void unknownFallsBackToToday() {
        var resolved = resolver.resolve("FOO", null, null);
        assertEquals("TODAY", resolved.key());
    }
}
