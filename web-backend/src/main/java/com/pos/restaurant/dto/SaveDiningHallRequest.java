package com.pos.restaurant.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveDiningHallRequest(
    @NotBlank String name,
    @NotNull @Min(0) Integer sortOrder
) {}
