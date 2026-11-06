package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreatePharmacyTransferRequest(
    @NotNull Integer fromStoreId,
    @NotNull Integer toStoreId,
    String fromStoreName,
    String toStoreName,
    String notes,
    @NotEmpty @Valid List<PharmacyTransferLineRequest> lines
) {}
