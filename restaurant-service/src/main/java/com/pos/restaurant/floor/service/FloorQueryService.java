package com.pos.restaurant.floor.service;

import com.pos.restaurant.floor.dto.FloorRevisionResponse;
import com.pos.restaurant.floor.dto.FloorSnapshotResponse;

public interface FloorQueryService {

    FloorSnapshotResponse getSnapshot(Integer storeId);

    /** Tiny watermark for multi-device POS sync — not a full floor snapshot. */
    FloorRevisionResponse getRevision(Integer storeId);
}
