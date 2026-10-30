package com.pos.platform.dto.desktop;

import jakarta.validation.constraints.Min;

import java.time.Instant;

public record DesktopBroadcastUpdateRequest(
    /** Absolute new expiry. Null = leave unchanged unless expiresInHours is set. */
    Instant expiresAt,
    /** Extend from now by N hours. Ignored if expiresAt is set. */
    @Min(1) Integer expiresInHours
) {
}
