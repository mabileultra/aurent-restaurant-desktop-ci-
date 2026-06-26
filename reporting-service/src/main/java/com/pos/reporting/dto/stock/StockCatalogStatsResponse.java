package com.pos.reporting.dto.stock;

public record StockCatalogStatsResponse(
    long activeProducts,
    long lowStockSkus
) {
}
