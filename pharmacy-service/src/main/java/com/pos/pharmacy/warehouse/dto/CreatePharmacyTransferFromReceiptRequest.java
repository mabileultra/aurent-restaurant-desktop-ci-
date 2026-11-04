package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreatePharmacyTransferFromReceiptRequest(
    @NotNull UUID receiptId,
    @NotNull Integer toStoreId,
    String fromStoreName,
    String toStoreName,
    String notes
) {}
