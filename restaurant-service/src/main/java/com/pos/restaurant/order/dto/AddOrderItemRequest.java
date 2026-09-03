package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddOrderItemRequest(
    @NotNull UUID menuItemId,
    @DecimalMin("0.001") BigDecimal quantity,
    String note,
    java.util.List<UUID> modifierOptionIds
) {}
