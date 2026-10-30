package com.pos.sales.dto.cashregister;

import java.time.Instant;

public record CashRegisterHeartbeatResponse(
    Long id,
    Instant lastSeenAt,
    String status
) {
}
