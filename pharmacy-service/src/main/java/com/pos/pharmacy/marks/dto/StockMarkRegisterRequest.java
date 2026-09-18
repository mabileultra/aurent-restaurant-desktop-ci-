package com.pos.pharmacy.marks.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record StockMarkRegisterRequest(
    @NotNull Integer storeId,
    UUID receiptId,
    @NotEmpty List<@Valid StockMarkRegisterItem> items
) {
}
