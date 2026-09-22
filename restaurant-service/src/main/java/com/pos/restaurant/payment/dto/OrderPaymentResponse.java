package com.pos.restaurant.payment.dto;

import com.pos.restaurant.payment.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderPaymentResponse(
    UUID id,
    UUID orderId,
    PaymentMethod method,
    BigDecimal amount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    Instant paidAt
) {}
