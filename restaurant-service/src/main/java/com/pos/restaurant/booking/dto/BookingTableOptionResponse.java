package com.pos.restaurant.booking.dto;

import com.pos.restaurant.floor.domain.TableStatus;

public record BookingTableOptionResponse(
    Integer id,
    String code,
    String label,
    String hallName,
    int seatCount,
    TableStatus status
) {
}
