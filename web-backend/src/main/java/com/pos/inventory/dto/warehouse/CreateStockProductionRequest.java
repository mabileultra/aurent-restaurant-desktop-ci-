package com.pos.inventory.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateStockProductionRequest(
    @NotNull Integer storeId,
    @NotNull UUID outputProductId,
    @NotNull @DecimalMin("0.001") BigDecimal outputQuantity,
    @NotNull @DecimalMin("0") BigDecimal outputUnitCost,
    String notes,
    @NotEmpty @Valid List<StockProductionLineRequest> lines
) {}
