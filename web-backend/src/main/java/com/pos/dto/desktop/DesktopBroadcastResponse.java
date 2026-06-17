package com.pos.dto.desktop;

import com.pos.entity.DesktopBroadcastKind;

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
