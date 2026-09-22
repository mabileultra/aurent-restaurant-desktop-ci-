package com.pos.inventory.dto.warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockExpenseResponse(
    UUID id,
    String expenseNumber,
    Integer storeId,
    String storeName,
    String reason,
    String recipient,
    String notes,
    BigDecimal totalQuantity,
    String createdByName,
    Instant createdAt,
    List<StockExpenseLineResponse> lines
) {}
