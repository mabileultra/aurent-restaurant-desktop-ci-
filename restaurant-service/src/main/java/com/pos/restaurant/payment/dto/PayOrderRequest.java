package com.pos.restaurant.payment.dto;

import com.pos.restaurant.payment.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PayOrderRequest(
    @NotNull PaymentMethod method,
    @NotNull @DecimalMin("0.01") BigDecimal amount
) {}
