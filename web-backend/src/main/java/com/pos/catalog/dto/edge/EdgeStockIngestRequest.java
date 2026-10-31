package com.pos.catalog.dto.edge;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EdgeStockIngestRequest(
    @NotNull Integer storeId,
    @NotNull List<EdgeStockIngestItem> products
) {}
