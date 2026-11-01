package com.pos.shared.api;

import java.time.Duration;
import java.time.Instant;

/**
 * Shared date-range rules for report/list filters across microservices.
 */
public final class DateRangeLimits {

    /** Default max span for admin reports (≈ 1 year). */
    public static final int MAX_DAYS_REPORT = 366;
    /** Shorter lists / ops boards. */
    public static final int MAX_DAYS_OPS = 93;

    private DateRangeLimits() {
    }

    public static InstantRange require(Instant from, Instant to) {
        return require(from, to, MAX_DAYS_REPORT);
    }

    public static InstantRange requireOps(Instant from, Instant to) {
        return require(from, to, MAX_DAYS_OPS);
    }

    public static InstantRange require(Instant from, Instant to, int maxDays) {
        if (from == null || to == null) {
            throw new FilterValidationException("Укажите период отчёта");
        }
        if (!to.isAfter(from)) {
            throw new FilterValidationException("Конец периода должен быть позже начала");
        }
        int days = Math.max(maxDays, 1);
        if (Duration.between(from, to).compareTo(Duration.ofDays(days)) > 0) {
            String bound = days == MAX_DAYS_REPORT ? "года" : (days + " дн.");
            throw new FilterValidationException("Период отчёта не может быть больше " + bound);
        }
        return new InstantRange(from, to);
    }
}
