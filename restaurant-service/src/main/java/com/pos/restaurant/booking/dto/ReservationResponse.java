package com.pos.restaurant.booking.dto;

import com.pos.restaurant.booking.domain.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
    UUID id,
    Integer storeId,
    Integer tableId,
    String tableCode,
    String tableLabel,
    String hallName,
    String clientName,
    String clientPhone,
    int guestCount,
    Instant reservedAt,
    int durationMinutes,
    String notes,
    ReservationStatus status,
    Instant createdAt
) {
}
