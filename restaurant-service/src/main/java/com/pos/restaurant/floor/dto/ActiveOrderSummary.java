package com.pos.restaurant.floor.dto;

import com.pos.restaurant.order.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ActiveOrderSummary(
    UUID id,
    int orderNo,
    OrderStatus status,
    int guestCount,
    int adultCount,
    int childrenCount,
    BigDecimal subtotal,
    int linesCount,
    UUID waiterUserId,
    Instant openedAt,
    List<String> linkedTableCodes
) {}
