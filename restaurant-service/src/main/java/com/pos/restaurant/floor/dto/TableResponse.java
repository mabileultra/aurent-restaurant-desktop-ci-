package com.pos.restaurant.floor.dto;

import com.pos.restaurant.floor.domain.TableStatus;

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
    ActiveOrderSummary activeOrder
) {}
