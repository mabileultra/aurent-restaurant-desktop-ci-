package com.pos.restaurant.kitchen.dto;

import java.util.UUID;

public record StationResponse(
    UUID id,
    Integer storeId,
    String code,
    String name,
    int sortOrder,
    boolean active
) {}
