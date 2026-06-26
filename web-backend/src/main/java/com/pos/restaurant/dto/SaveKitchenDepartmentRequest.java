package com.pos.restaurant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveKitchenDepartmentRequest(
    @NotBlank @Size(max = 100) String value,
    @NotBlank @Size(max = 200) String label,
    Integer sortOrder
) {}
