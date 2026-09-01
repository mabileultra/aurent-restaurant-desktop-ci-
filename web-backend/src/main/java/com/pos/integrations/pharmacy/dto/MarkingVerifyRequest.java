package com.pos.integrations.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarkingVerifyRequest(
  @NotNull Integer storeId,
  @NotBlank String code
) {
}
