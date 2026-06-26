package com.pos.restaurant.dto;

import java.util.List;

public record RestaurantFloorSnapshotResponse(
    Integer storeId,
    String storeName,
    List<DiningHallWithTablesResponse> halls
) {
    public record DiningHallWithTablesResponse(
        Integer id,
        String name,
        int sortOrder,
        boolean active,
        List<DiningTableResponse> tables
    ) {}
}
