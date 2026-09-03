package com.pos.restaurant.order.dto;

import com.pos.restaurant.order.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    int orderNo,
    Integer tableId,
    String tableCode,
    Integer storeId,
    OrderStatus status,
    int guestCount,
    int adultCount,
    int childrenCount,
    UUID openedByUserId,
    UUID waiterUserId,
    String comment,
    Instant openedAt,
    Instant closedAt,
    BigDecimal subtotal,
    int linesCount,
    List<OrderItemResponse> items
) {}
