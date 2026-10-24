package com.pos.integrations.marking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarkSoldCheckRequest(
    @NotNull Integer storeId,
    @NotBlank String code
) {}
