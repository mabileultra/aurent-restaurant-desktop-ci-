package com.pos.inventory.dto.warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockProductionResponse(
    UUID id,
    String productionNumber,
    Integer storeId,
    String storeName,
    UUID outputProductId,
    String outputProductName,
    BigDecimal outputQuantity,
    BigDecimal outputUnitCost,
    String notes,
    BigDecimal totalInputQuantity,
    BigDecimal totalInputCost,
    String createdByName,
    Instant createdAt,
    List<StockProductionLineResponse> lines
) {}
