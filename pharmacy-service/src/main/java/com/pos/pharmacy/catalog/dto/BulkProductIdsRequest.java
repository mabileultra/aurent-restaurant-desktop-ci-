package com.pos.pharmacy.catalog.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkProductIdsRequest(
    @NotEmpty List<UUID> productIds
) {}
