package com.pos.integrations.pharmacy.dto;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;

import java.time.Instant;

public record AslRequestLogItemResponse(
    Long id,
    Integer storeId,
    String storeName,
    AslRequestOperation operation,
    AslRequestOutcome outcome,
    boolean reached,
    Integer httpStatus,
    String endpoint,
    String markCodeShort,
    String aslStatus,
    String message,
    Integer durationMs,
    Instant createdAt
) {
}
