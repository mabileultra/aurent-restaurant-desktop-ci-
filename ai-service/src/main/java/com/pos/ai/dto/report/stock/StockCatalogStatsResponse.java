package com.pos.ai.dto.report.stock;

public record StockCatalogStatsResponse(
    long activeProducts,
    long lowStockSkus
) {
}
