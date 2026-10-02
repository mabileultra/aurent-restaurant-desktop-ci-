package com.pos.restaurant.payment.dto;

import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PayOrderRequest(
    @NotNull PaymentMethod method,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    PaymentCardType cardType,
    @Size(max = 32) String debtPhone,
    @Size(max = 500) String debtComment,
    BigDecimal advancePaid
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
