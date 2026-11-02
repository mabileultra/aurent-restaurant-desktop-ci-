package com.pos.sales.service.sync;

import com.pos.sales.dto.sync.CatalogSnapshotPullResponse;

import java.time.Instant;

public interface CatalogSnapshotPullService {

    CatalogSnapshotPullResponse pull(Integer companyId, Instant since, int limit);
}
