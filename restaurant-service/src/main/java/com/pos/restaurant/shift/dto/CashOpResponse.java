package com.pos.restaurant.shift.dto;

import com.pos.restaurant.shift.domain.CashOpType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CashOpResponse(
    UUID id,
    UUID shiftId,
    CashOpType type,
    BigDecimal amount,
    String comment,
    UUID createdByUserId,
    Instant createdAt
) {
}
