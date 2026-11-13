package com.pos.pharmacy.catalog.registry.dto;

import java.time.Instant;
import java.util.UUID;

public record DrugRegistryLatestResponse(
    UUID importId,
    String fileName,
    String source,
    int rowCount,
    Instant createdAt
) {
}
