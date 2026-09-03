package com.pos.restaurant.kitchen.dto;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record KitchenTicketResponse(
    UUID id,
    UUID orderId,
    int orderNo,
    Integer tableId,
    String tableCode,
    UUID stationId,
    String stationName,
    KitchenTicketStatus status,
    Instant sentAt,
    List<KitchenTicketLineResponse> lines
) {}
