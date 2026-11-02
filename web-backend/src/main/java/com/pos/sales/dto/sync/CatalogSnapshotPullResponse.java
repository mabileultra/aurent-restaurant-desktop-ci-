package com.pos.sales.dto.sync;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CatalogSnapshotPullResponse(
    List<Map<String, Object>> events,
    Instant syncedAt,
    boolean catalogEnabled
) {
    public static CatalogSnapshotPullResponse empty(boolean catalogEnabled) {
        return new CatalogSnapshotPullResponse(List.of(), Instant.now(), catalogEnabled);
    }
}
