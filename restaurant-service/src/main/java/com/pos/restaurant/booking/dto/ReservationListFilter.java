package com.pos.restaurant.booking.dto;

import com.pos.restaurant.booking.domain.ReservationStatus;

import java.time.Instant;

/**
 * List filters for store reservations. Period uses platform ops range when both bounds set
 * (or when defaults apply). {@code activeOnly} limits to PENDING/CONFIRMED without requiring dates.
 */
public record ReservationListFilter(
    Instant from,
    Instant to,
    boolean activeOnly,
    ReservationStatus status,
    String search
) {
}
