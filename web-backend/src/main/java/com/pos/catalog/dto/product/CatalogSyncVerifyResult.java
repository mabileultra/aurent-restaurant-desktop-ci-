package com.pos.catalog.dto.product;

import java.util.List;
import java.util.UUID;

public record CatalogSyncVerifyResult(
    Integer companyId,
    boolean catalogEnabled,
    boolean remoteReachable,
    long localTotal,
    long localActive,
    long localInactive,
    Long remoteTotal,
    Long remoteActive,
    Long remoteInactive,
    long totalDelta,
    long activeDelta,
    boolean countsMatch,
    int sampleChecked,
    int sampleMissingRemote,
    List<UUID> sampleMissingIds
) {
}
