package com.pos.restaurant.shift.dto;

import com.pos.restaurant.shift.domain.RestaurantShiftStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShiftResponse(
    UUID id,
    Integer storeId,
    RestaurantShiftStatus status,
    UUID openedByUserId,
    UUID closedByUserId,
    Instant openedAt,
    Instant closedAt,
    BigDecimal openingCash,
    BigDecimal closingCash,
    int saleCount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    String comment,
    int openOrderCount
) {
}
