package com.pos.restaurant.order.dto;

import com.pos.restaurant.order.domain.OrderChannel;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Cashier journal row: one refused / cancelled kitchen (or order) line. */
public record CancelledItemSummaryResponse(
    UUID id,
    UUID orderId,
    int orderNo,
    OrderChannel channel,
    String itemName,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    Integer tableId,
    String tableCode,
    String hallName,
    Instant cancelledAt,
    UUID waiterUserId
) {}
