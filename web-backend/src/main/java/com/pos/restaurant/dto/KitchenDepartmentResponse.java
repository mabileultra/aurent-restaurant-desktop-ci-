package com.pos.restaurant.dto;

public record KitchenDepartmentResponse(
    Integer id,
    String value,
    String label,
    int sortOrder
) {}
