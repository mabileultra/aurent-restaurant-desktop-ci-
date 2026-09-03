package com.pos.restaurant.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record ActivityEventResponse(
    Instant at,
    String type,
    String summary,
    UUID actorUserId,
    String entityType,
    String entityId
) {
}
