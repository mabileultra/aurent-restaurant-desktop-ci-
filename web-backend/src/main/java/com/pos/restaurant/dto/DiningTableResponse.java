package com.pos.restaurant.dto;

import com.pos.restaurant.domain.DiningTableStatus;

public record DiningTableResponse(
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
    DiningTableStatus status,
    boolean active,
    TableSessionSummaryResponse activeSession
) {}
