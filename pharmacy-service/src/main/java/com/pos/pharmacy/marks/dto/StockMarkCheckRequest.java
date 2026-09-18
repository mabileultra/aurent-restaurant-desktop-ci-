package com.pos.pharmacy.marks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StockMarkCheckRequest(
    @NotNull Integer storeId,
    @NotBlank String code
) {
}
