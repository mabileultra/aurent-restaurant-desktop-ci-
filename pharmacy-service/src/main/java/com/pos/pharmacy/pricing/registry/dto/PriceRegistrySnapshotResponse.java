package com.pos.pharmacy.pricing.registry.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PriceRegistrySnapshotResponse(
    UUID id,
    String sourceUrl,
    String fileName,
    LocalDate registryDate,
    int rowCount,
    String status,
    Instant createdAt
) {}
