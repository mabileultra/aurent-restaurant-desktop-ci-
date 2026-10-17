package com.pos.restaurant.edge.dto.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record EdgeCatalogImportRequest(
    String bootstrapSecret,
    @NotNull @Valid EdgeCatalogSnapshot snapshot
) {}
