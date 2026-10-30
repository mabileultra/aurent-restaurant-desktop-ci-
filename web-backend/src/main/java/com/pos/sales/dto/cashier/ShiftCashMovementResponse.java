package com.pos.sales.dto.cashier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShiftCashMovementResponse(
    UUID id,
    UUID shiftId,
    String direction,
    BigDecimal amount,
    String note,
    Instant createdAt
) {
}
