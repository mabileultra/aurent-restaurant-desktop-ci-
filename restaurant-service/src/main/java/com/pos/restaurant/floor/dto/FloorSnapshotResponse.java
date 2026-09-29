package com.pos.restaurant.floor.dto;

import java.math.BigDecimal;
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
        BigDecimal servicePercent,
        List<TableResponse> tables
    ) {}
}
