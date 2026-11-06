package com.pos.pharmacy.pricing.registry.dto;

import java.util.UUID;

public record PriceRegistrySyncResult(
    UUID snapshotId,
    int registryRows,
    int pendingOverLimit,
    int skippedOk,
    int unmatched,
    int applied,
    String sourceUrl
) {}
