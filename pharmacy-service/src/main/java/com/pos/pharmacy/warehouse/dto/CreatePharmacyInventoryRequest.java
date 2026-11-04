package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreatePharmacyInventoryRequest(
    @NotNull Integer storeId,
    String notes,
    @NotEmpty @Valid List<PharmacyInventoryLineRequest> lines
) {}
