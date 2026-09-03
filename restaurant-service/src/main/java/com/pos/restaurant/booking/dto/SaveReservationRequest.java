package com.pos.restaurant.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record SaveReservationRequest(
    @NotNull Integer tableId,
    @NotBlank String clientName,
    String clientPhone,
    @NotNull @Min(1) Integer guestCount,
    @NotNull Instant reservedAt,
    @Min(30) Integer durationMinutes,
    String notes
) {
}
