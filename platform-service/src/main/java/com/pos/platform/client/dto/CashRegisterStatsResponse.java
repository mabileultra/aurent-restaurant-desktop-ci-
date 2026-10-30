package com.pos.platform.client.dto;

public record CashRegisterStatsResponse(
    long totalRegisters,
    long activeRegisters,
    long inactiveRegisters,
    long onlineRegisters
) {
}
