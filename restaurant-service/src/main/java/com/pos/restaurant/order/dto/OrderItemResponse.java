package com.pos.restaurant.order.dto;

import com.pos.restaurant.order.domain.OrderItemStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
    UUID id,
    UUID menuItemId,
    String name,
    String portionText,
    BigDecimal quantity,
    BigDecimal returnedQuantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    BigDecimal taxRate,
    String note,
    OrderItemStatus itemStatus,
    int sortOrder,
    UUID stationId,
    java.util.List<OrderItemModifierResponse> modifiers
) {}
