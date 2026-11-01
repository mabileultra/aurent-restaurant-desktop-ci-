package com.pos.platform.dto.desktop;

import com.pos.platform.entity.DesktopBroadcastKind;
import com.pos.platform.entity.DesktopBroadcastStatus;
import com.pos.platform.entity.DesktopBroadcastTargetType;

import java.time.Instant;
import java.util.List;
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
    boolean read,
    DesktopBroadcastTargetType targetType,
    DesktopBroadcastStatus status,
    Instant scheduledAt,
    List<Integer> companyIds,
    List<Integer> storeIds
) {
}
