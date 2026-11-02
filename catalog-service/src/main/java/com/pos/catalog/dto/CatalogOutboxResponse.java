package com.pos.catalog.dto;

import java.time.Instant;
import java.util.UUID;

public record CatalogOutboxResponse(
    UUID id,
    String eventType,
    UUID aggregateId,
    Integer companyId,
    String payload,
    String status,
    int attempts,
    Instant createdAt
) {
}
