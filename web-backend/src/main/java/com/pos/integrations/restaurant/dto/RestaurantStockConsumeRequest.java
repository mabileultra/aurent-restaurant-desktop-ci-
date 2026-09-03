package com.pos.integrations.restaurant.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RestaurantStockConsumeRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID saleId,
    UUID createdBy,
    String receiptNumber,
    @NotEmpty @Valid List<Line> lines
) {
    public record Line(
        @NotNull UUID productId,
        @NotNull @DecimalMin("0.001") BigDecimal quantity
    ) {}
}
