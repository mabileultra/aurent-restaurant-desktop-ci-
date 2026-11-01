package com.pos.restaurant.booking.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.shared.api.DateRangeLimits;
import com.pos.shared.api.FilterValidationException;
import com.pos.shared.api.InstantRange;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Ops date window for reservation lists (defaults: yesterday → +7 days). */
public final class ReservationPeriod {

    private static final long DEFAULT_PAST_SECONDS = 86_400L;
    private static final long DEFAULT_FUTURE_DAYS = 7L;

    private ReservationPeriod() {
    }

    public static InstantRange resolve(Instant from, Instant to) {
        Instant start = from != null ? from : Instant.now().minusSeconds(DEFAULT_PAST_SECONDS);
        Instant end = to != null ? to : Instant.now().plus(DEFAULT_FUTURE_DAYS, ChronoUnit.DAYS);
        try {
            return DateRangeLimits.requireOps(start, end);
        } catch (FilterValidationException ex) {
            throw new ValidationException(ex.getMessage());
        }
    }
}
