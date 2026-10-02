package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;

import java.time.Duration;
import java.time.Instant;

public final class ReportPeriod {

    static final Duration MAX_RANGE = Duration.ofDays(366);

    private ReportPeriod() {
    }

    public static void assertValid(Instant from, Instant to) {
        if (from == null || to == null) {
            throw new ValidationException("Укажите период отчёта");
        }
        if (!to.isAfter(from)) {
            throw new ValidationException("Конец периода должен быть позже начала");
        }
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
            throw new ValidationException("Период отчёта не может быть больше года");
        }
    }
}
