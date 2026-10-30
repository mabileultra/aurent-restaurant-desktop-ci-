package com.pos.dto.platform.internal;

public record CashRegisterStatsResponse(
    long totalRegisters,
    long activeRegisters,
    long inactiveRegisters,
    long onlineRegisters
) {
}
