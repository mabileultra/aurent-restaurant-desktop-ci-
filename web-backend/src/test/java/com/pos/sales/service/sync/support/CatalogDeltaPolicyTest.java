package com.pos.sales.service.sync.support;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogDeltaPolicyTest {

    @Test
    void nullSinceRequiresFullReset() {
        Instant now = Instant.parse("2026-10-30T00:00:00Z");
        assertThat(CatalogDeltaPolicy.requiresFullReset(null, now)).isTrue();
        assertThat(CatalogDeltaPolicy.requiresFullReset(now, null)).isTrue();
    }

    @Test
    void futureSinceRequiresFullReset() {
        Instant now = Instant.parse("2026-10-30T00:00:00Z");
        assertThat(CatalogDeltaPolicy.requiresFullReset(now.plus(1, ChronoUnit.HOURS), now)).isTrue();
    }

    @Test
    void olderThanMaxAgeRequiresFullReset() {
        Instant now = Instant.parse("2026-10-30T00:00:00Z");
        Instant since = now.minus(CatalogDeltaPolicy.MAX_DELTA_AGE).minus(1, ChronoUnit.MINUTES);
        assertThat(CatalogDeltaPolicy.requiresFullReset(since, now)).isTrue();
    }

    @Test
    void recentSinceAllowsDelta() {
        Instant now = Instant.parse("2026-10-30T00:00:00Z");
        Instant since = now.minus(2, ChronoUnit.HOURS);
        assertThat(CatalogDeltaPolicy.requiresFullReset(since, now)).isFalse();
    }

    @Test
    void exactlyMaxAgeAllowsDelta() {
        Instant now = Instant.parse("2026-10-30T00:00:00Z");
        Instant since = now.minus(CatalogDeltaPolicy.MAX_DELTA_AGE);
        assertThat(CatalogDeltaPolicy.requiresFullReset(since, now)).isFalse();
    }
}
