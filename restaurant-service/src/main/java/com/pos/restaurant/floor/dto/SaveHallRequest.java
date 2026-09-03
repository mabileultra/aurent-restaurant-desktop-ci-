package com.pos.restaurant.floor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveHallRequest(
    @NotBlank String name,
    @NotNull @Min(0) Integer sortOrder
) {}
