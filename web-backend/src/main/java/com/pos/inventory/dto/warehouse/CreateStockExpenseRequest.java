package com.pos.inventory.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateStockExpenseRequest(
    @NotNull Integer storeId,
    @NotBlank String reason,
    String recipient,
    String notes,
    @NotEmpty @Valid List<StockExpenseLineRequest> lines
) {}
