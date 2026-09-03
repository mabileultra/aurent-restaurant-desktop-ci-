package com.pos.restaurant.kitchen.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SaveStationRequest(
    @NotBlank String code,
    @NotBlank String name,
    @Min(0) Integer sortOrder
) {}
