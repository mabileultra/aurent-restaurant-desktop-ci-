package com.pos.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

public record TableSessionCheckoutRequest(
    @NotBlank String paymentMethod,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    String notes,
    UUID customerId,
    String receiptType,
    String cardType,
    @DecimalMin("0") BigDecimal orderDiscountAmount,
    @DecimalMin("0") BigDecimal orderDiscountPercent,
    @DecimalMin("0") BigDecimal advanceAmount
) {}
