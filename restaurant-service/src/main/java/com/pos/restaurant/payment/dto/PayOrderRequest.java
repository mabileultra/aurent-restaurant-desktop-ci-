package com.pos.restaurant.payment.dto;

import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PayOrderRequest(
    @NotNull PaymentMethod method,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    PaymentCardType cardType
) {
    public PayOrderRequest {
        if (cashAmount == null) {
            cashAmount = BigDecimal.ZERO;
        }
        if (cardAmount == null) {
            cardAmount = BigDecimal.ZERO;
        }
        if (amountTendered == null) {
            amountTendered = amount;
        }
        if (changeGiven == null) {
            changeGiven = BigDecimal.ZERO;
        }
    }
}
