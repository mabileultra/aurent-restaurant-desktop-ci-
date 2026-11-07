package com.pos.identity.dto.security;

import java.time.Instant;
import java.util.UUID;

public record AuthSessionResponse(
    UUID id,
    UUID userId,
    String who,
    String device,
    String deviceType,
    String where,
    String when,
    boolean current,
    Instant lastSeenAt,
    Instant createdAt
) {
}
