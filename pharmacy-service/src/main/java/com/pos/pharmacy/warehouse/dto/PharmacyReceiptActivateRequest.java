package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/** Опциональное тело activate: без marks — старое поведение; с marks — регистрация на складе КМ. */
public record PharmacyReceiptActivateRequest(
    List<@Valid PharmacyReceiptMarkItem> marks
) {
    public record PharmacyReceiptMarkItem(
        @NotNull UUID productId,
        UUID receiptLineId,
        @NotBlank String markCode,
        String aslStatus
    ) {
    }
}
