package com.pos.restaurant.floor.dto;

import com.pos.restaurant.floor.domain.TableStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TableResponse(
    Integer id,
    Integer hallId,
    String hallName,
    String code,
    String label,
    int seatCount,
    int posX,
    int posY,
    int width,
    int height,
    TableStatus status,
    boolean active,
    Instant updatedAt,
    ActiveOrderSummary activeOrder,
    TableReservationSummary reservation,
    BigDecimal servicePercent,
    List<ActiveOrderSummary> activeOrders
) {}
