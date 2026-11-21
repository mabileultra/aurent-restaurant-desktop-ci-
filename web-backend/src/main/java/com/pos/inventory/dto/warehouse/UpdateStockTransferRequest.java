package com.pos.inventory.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Полная замена строк и магазинов черновика перемещения. */
public record UpdateStockTransferRequest(
    @NotNull Integer fromStoreId,
    @NotNull Integer toStoreId,
    String notes,
    @NotEmpty @Valid List<StockTransferLineRequest> lines
) {}
