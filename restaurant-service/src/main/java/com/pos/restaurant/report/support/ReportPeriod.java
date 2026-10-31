package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.shared.api.DateRangeLimits;
import com.pos.shared.api.FilterValidationException;
import com.pos.shared.api.InstantRange;

import java.time.Instant;

/** Restaurant adapter over platform {@link DateRangeLimits}. */
public final class ReportPeriod {

    private ReportPeriod() {
    }

    public static InstantRange require(Instant from, Instant to) {
        try {
            return DateRangeLimits.require(from, to);
        } catch (FilterValidationException ex) {
            throw new ValidationException(ex.getMessage());
        }
    }

    public static void assertValid(Instant from, Instant to) {
        require(from, to);
    }
}
