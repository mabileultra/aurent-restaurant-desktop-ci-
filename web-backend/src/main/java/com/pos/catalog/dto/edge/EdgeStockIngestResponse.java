package com.pos.catalog.dto.edge;

public record EdgeStockIngestResponse(
    int upserted,
    int skipped,
    int storeId
) {}
