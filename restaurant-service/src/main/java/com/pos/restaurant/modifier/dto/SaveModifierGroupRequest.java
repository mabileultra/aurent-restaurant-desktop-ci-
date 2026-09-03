package com.pos.restaurant.modifier.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SaveModifierGroupRequest(
    @NotBlank String name,
    @Min(0) Integer minSelect,
    @Min(1) Integer maxSelect,
    @Min(0) Integer sortOrder
) {}
