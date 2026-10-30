package com.pos.reporting.dto.stock;

import java.math.BigDecimal;
import java.util.List;

public record StockDashboardResponse(
    long receivedUnits,
    BigDecimal receivedCostEstimate,
    long soldUnits,
    long writeOffUnits,
    BigDecimal writeOffCostEstimate,
    long currentStockUnits,
    BigDecimal currentStockCostEstimate,
    BigDecimal currentStockRetailEstimate,
    long lowStockSkuCount,
    List<StockDashboardDayPoint> dailyBreakdown
) {
}
