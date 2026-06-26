package com.pos.platform.dto.platform.security;

public record CashierServerPasswordStatusResponse(
    boolean configured,
    String updatedAt
) {
}
