package com.pos.shared.api;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DateRangeLimitsTest {

    @Test
    void requiresOrderedBounds() {
        Instant from = Instant.parse("2026-01-01T00:00:00Z");
        Instant to = Instant.parse("2026-01-02T00:00:00Z");
        InstantRange range = DateRangeLimits.require(from, to);
        assertEquals(from, range.from());
        assertEquals(to, range.to());
    }

    @Test
    void rejectsMissingAndInverted() {
        Instant t = Instant.parse("2026-01-01T00:00:00Z");
        assertThrows(FilterValidationException.class, () -> DateRangeLimits.require(null, t));
        assertThrows(FilterValidationException.class, () -> DateRangeLimits.require(t, t));
    }

    @Test
    void rejectsTooLong() {
        Instant from = Instant.parse("2025-01-01T00:00:00Z");
        Instant to = from.plus(400, ChronoUnit.DAYS);
        assertThrows(FilterValidationException.class, () -> DateRangeLimits.require(from, to));
    }
}
