package com.pos.pharmacy.warehouse.dto;

import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record PharmacyReceiptMassUpdateRequest(
    List<UUID> lineIds,
    @NotNull PharmacyReceiptMassField field,
    String value
) {}
