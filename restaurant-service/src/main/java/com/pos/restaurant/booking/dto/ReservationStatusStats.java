package com.pos.restaurant.booking.dto;

/** Status counts for the list period window (ignores search / status chip). */
public record ReservationStatusStats(
    long pending,
    long confirmed,
    long seated,
    long cancelled
) {
    public static ReservationStatusStats empty() {
        return new ReservationStatusStats(0, 0, 0, 0);
    }
}
