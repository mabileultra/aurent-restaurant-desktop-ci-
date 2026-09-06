package com.pos.restaurant.floor.dto;

import java.time.Instant;
import java.util.UUID;

public record TableReservationSummary(
    UUID id,
    String clientName,
    String clientPhone,
    int guestCount,
    Instant reservedAt,
    String notes
) {}
