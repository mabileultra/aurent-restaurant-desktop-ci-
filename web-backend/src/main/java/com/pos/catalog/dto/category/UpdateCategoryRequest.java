package com.pos.catalog.dto.category;

import jakarta.validation.constraints.NotBlank;

public record UpdateCategoryRequest(
    @NotBlank String name,
    String description,
    Integer businessTypeId
) {}
