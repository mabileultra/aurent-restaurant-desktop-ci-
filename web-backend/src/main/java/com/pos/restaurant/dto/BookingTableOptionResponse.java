package com.pos.restaurant.dto;

public record BookingTableOptionResponse(
    Integer id,
    Integer hallId,
    String hallName,
    String code,
    String label,
    int seatCount,
    String status
) {}
