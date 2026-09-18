package com.pos.integrations.pharmacy.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MarkingWithdrawRequest(
    @NotNull Integer storeId,
    @NotEmpty List<@NotNull String> codes,
    Boolean fiscalConfirmed
) {
}
