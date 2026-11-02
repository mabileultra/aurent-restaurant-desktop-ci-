package com.pos.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpsertCategoryRequest(
    @NotNull UUID id,
    @NotNull Integer companyId,
    @NotBlank String name,
    Boolean active,
    Integer sortOrder
) {
}
