package com.pos.dto.report.stock;

public record StockCatalogStatsResponse(
    long activeProducts,
    long lowStockSkus
) {
}
