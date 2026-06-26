package com.pos.restaurant.dto;

import java.time.Instant;
import java.util.UUID;

public record TableReservationResponse(
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
    String status,
    Instant createdAt
) {}
