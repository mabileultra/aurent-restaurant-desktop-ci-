package com.pos.pharmacy.marks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockMarkRegisterItem(
    @NotNull UUID productId,
    @NotBlank String markCode,
    UUID lotId,
    UUID receiptLineId,
    String aslStatus
) {
}
