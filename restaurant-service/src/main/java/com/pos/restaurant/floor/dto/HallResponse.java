package com.pos.restaurant.floor.dto;

public record HallResponse(
    Integer id,
    Integer storeId,
    String name,
    int sortOrder,
    boolean active,
    int tableCount
) {}
