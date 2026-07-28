package com.pos.sales.dto.sync;

import java.util.List;

public record OfflineSalesBatchResponse(
    List<OfflineSaleSyncResult> results
) {}
