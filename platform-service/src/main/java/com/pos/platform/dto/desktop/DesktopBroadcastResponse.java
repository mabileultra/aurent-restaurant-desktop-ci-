package com.pos.platform.dto.desktop;

import com.pos.platform.entity.DesktopBroadcastKind;

import java.time.Instant;
import java.util.UUID;

public record DesktopBroadcastResponse(
    UUID id,
    String title,
    String body,
    DesktopBroadcastKind kind,
    int priority,
    String actionLabel,
    String actionUrl,
    Instant createdAt,
    Instant expiresAt,
    boolean read
) {
}
