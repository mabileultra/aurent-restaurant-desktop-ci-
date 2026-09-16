package com.pos.pharmacy.sync.dto;

import java.util.List;

public record OfflineSalesBatchResponse(
    List<OfflineSaleSyncResult> results
) {}
