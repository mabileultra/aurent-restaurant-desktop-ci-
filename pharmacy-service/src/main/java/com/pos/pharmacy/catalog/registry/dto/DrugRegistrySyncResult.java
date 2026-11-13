package com.pos.pharmacy.catalog.registry.dto;

import java.util.UUID;

public record DrugRegistrySyncResult(
    UUID importId,
    int rowCount,
    boolean skipped,
    int filledProducts
) {
}
