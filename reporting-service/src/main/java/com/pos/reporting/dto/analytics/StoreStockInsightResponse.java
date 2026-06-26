package com.pos.reporting.dto.analytics;

import com.pos.reporting.dto.StoreSalesRowResponse;

import java.util.List;

public record StoreStockInsightResponse(
    List<StoreSalesRowResponse> storeSales,
    List<StoreStockTotalRowResponse> stockTotalsByStore,
    List<StoreProductStockRowResponse> stockByProductStore,
    List<SoldUnitsByStoreProductRowResponse> soldByProductStore
) {
}
