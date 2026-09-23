package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateOrderDiscountRequest(
    @NotNull @DecimalMin("0.00") BigDecimal discountAmount
) {}
