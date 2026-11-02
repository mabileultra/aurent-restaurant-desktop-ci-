package com.pos.client.catalog;

import java.time.Instant;
import java.util.UUID;

public record CatalogRemoteOutboxRow(
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
