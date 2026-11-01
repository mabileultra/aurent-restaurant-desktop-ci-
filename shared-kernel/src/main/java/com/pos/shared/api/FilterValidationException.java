package com.pos.shared.api;

/**
 * Invalid list/report filter (date range, search, …).
 * Services map this to their HTTP validation exception.
 */
public final class FilterValidationException extends IllegalArgumentException {

    public FilterValidationException(String message) {
        super(message);
    }
}
