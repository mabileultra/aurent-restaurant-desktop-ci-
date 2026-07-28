package com.pos.integrations.finance.dto;

import java.time.Instant;
import java.util.UUID;

public record FinanceSyncOutboxDto(
    UUID id,
    String eventType,
    String targetPath,
    String idempotencyKey,
    String status,
    Integer attempts,
    String lastError,
    Instant createdAt,
    Instant updatedAt,
    Instant nextRetryAt
) {
}
