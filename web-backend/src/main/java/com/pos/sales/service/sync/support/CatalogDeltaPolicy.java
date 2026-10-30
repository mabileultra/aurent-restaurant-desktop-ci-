package com.pos.sales.service.sync.support;

import java.time.Duration;
import java.time.Instant;

/**
 * When the cashier must fall back to full /sync/bootstrap instead of a delta pull.
 */
public final class CatalogDeltaPolicy {

    public static final Duration MAX_DELTA_AGE = Duration.ofDays(7);

    private CatalogDeltaPolicy() {}

    public static boolean requiresFullReset(Instant since, Instant now) {
        if (since == null || now == null) {
            return true;
        }
        if (since.isAfter(now)) {
            return true;
        }
        return Duration.between(since, now).compareTo(MAX_DELTA_AGE) > 0;
    }
}
