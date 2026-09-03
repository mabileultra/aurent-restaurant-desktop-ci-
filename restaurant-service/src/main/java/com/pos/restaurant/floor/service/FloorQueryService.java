package com.pos.restaurant.floor.service;

import com.pos.restaurant.floor.dto.FloorSnapshotResponse;

public interface FloorQueryService {

    FloorSnapshotResponse getSnapshot(Integer storeId);
}
