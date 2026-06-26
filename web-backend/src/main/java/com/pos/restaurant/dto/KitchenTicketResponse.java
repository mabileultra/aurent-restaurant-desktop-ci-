package com.pos.restaurant.dto;

import com.pos.restaurant.domain.KitchenTicketStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record KitchenTicketResponse(
    UUID id,
    Integer storeId,
    UUID sessionId,
    UUID sessionLineId,
    String tableCode,
    UUID productId,
    String productName,
    BigDecimal quantity,
    String note,
    String kitchenDepartment,
    KitchenTicketStatus status,
    Instant createdAt,
    Instant updatedAt
) {}
