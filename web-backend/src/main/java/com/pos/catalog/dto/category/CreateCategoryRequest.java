package com.pos.catalog.dto.category;

import jakarta.validation.constraints.NotBlank;

public record CreateCategoryRequest(
    @NotBlank String name,
    String description,
    Integer businessTypeId
) {}
