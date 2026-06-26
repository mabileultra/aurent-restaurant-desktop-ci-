package com.pos.restaurant.dto;

import com.pos.restaurant.domain.DiningTableStatus;

public record DiningHallResponse(
    Integer id,
    Integer storeId,
    String storeName,
    String name,
    int sortOrder,
    boolean active,
    int tablesCount
) {}
