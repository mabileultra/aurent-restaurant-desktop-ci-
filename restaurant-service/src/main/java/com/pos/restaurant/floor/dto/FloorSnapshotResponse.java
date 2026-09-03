package com.pos.restaurant.floor.dto;

import java.util.List;

public record FloorSnapshotResponse(
    Integer storeId,
    List<HallFloorResponse> halls
) {
    public record HallFloorResponse(
        Integer id,
        String name,
        int sortOrder,
        boolean active,
        List<TableResponse> tables
    ) {}
}
