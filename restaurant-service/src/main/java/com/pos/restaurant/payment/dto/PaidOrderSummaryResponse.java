package com.pos.restaurant.payment.dto;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.payment.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaidOrderSummaryResponse(
    UUID id,
    int orderNo,
    OrderChannel channel,
    Integer tableId,
    String tableCode,
    Integer storeId,
    OrderStatus status,
    String clientName,
    Instant closedAt,
    BigDecimal subtotal,
    BigDecimal commissionAmount,
    BigDecimal totalAmount,
    PaymentMethod paymentMethod,
    BigDecimal paidAmount
) {}
