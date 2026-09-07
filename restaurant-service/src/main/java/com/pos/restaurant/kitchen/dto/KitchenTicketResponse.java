package com.pos.restaurant.kitchen.dto;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.domain.OrderChannel;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record KitchenTicketResponse(
    UUID id,
    UUID orderId,
    int orderNo,
    OrderChannel channel,
    Integer tableId,
    String tableCode,
    String hallName,
    UUID waiterUserId,
    String clientName,
    UUID stationId,
    String stationName,
    KitchenTicketStatus status,
    Instant sentAt,
    List<KitchenTicketLineResponse> lines
) {}
