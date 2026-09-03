package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateOrderItemRequest(
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    String note
) {}
