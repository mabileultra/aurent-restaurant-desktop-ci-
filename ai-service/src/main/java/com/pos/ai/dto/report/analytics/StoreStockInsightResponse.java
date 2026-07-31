package com.pos.ai.dto.report.analytics;

import com.pos.ai.dto.report.sales.StoreSalesRowResponse;

import java.util.List;

public record StoreStockInsightResponse(
    List<StoreSalesRowResponse> storeSales,
    List<StoreStockTotalRowResponse> stockTotalsByStore,
    List<StoreProductStockRowResponse> stockByProductStore,
    List<SoldUnitsByStoreProductRowResponse> soldByProductStore
) {
}
