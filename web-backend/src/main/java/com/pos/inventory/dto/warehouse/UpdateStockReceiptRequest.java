package com.pos.inventory.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

/** Полная замена строк и метаданных проведённого прихода. */
public record UpdateStockReceiptRequest(
    UUID supplierId,
    Integer storeId,
    String notes,
    String paymentType,
    @NotEmpty @Valid List<StockReceiptLineRequest> lines
) {}
