package com.pos.reporting.mapper;

import com.pos.reporting.dto.analytics.SoldUnitsByStoreProductRowResponse;
import com.pos.reporting.dto.analytics.StoreProductStockRowResponse;
import com.pos.reporting.dto.analytics.StoreStockTotalRowResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StoreStockInsightRowMapper {

    public StoreStockTotalRowResponse toStockTotalRow(Object[] row) {
        Integer storeId = row[0] != null ? ((Number) row[0]).intValue() : null;
        String storeName = row[1] != null ? row[1].toString() : null;
        long stockQty = row[2] instanceof Number n ? n.longValue() : 0L;
        return new StoreStockTotalRowResponse(storeId, storeName, stockQty);
    }

    public StoreProductStockRowResponse toProductStockRow(Object[] row) {
        UUID productId = row[0] != null ? UUID.fromString(row[0].toString()) : null;
        Integer storeId = row[1] != null ? ((Number) row[1]).intValue() : null;
        String storeName = row[2] != null ? row[2].toString() : null;
        String productName = row[3] != null ? row[3].toString() : null;
        int stockQty = row[4] instanceof Number n ? n.intValue() : 0;
        return new StoreProductStockRowResponse(productId, storeId, storeName, productName, stockQty);
    }

    public SoldUnitsByStoreProductRowResponse toSoldUnitsRow(Object[] row) {
        UUID productId = row[0] != null ? UUID.fromString(row[0].toString()) : null;
        Integer storeId = row[1] != null ? ((Number) row[1]).intValue() : null;
        String productName = row[2] != null ? row[2].toString() : null;
        long soldUnits = row[3] instanceof Number n ? n.longValue() : 0L;
        return new SoldUnitsByStoreProductRowResponse(productId, storeId, productName, soldUnits);
    }
}
