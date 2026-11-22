package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.StockRetailValueMath;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;

import java.math.BigDecimal;
import java.time.Instant;

public final class LiveStockBalanceRowMapper {

    private LiveStockBalanceRowMapper() {}

    public static StockBalanceRowResponse toBalance(
        Product product,
        BigDecimal rawQty,
        Instant stockUpdatedAt
    ) {
        BigDecimal qty = StockRetailValueMath.displayQty(rawQty);
        BigDecimal cost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        BigDecimal retail = product.getSellingPrice() != null ? product.getSellingPrice() : BigDecimal.ZERO;
        return new StockBalanceRowResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBarcode(),
            product.getCategory() != null ? product.getCategory().getName() : null,
            StockRetailValueMath.scaleQty(qty),
            product.getLowStockAlert(),
            cost,
            StockRetailValueMath.scaleMoney(StockRetailValueMath.lineValue(retail, rawQty)),
            stockUpdatedAt
        );
    }

    public static LowStockRowResponse toLowStock(
        Product product,
        BigDecimal rawQty,
        Instant stockUpdatedAt,
        Integer storeId,
        String storeName
    ) {
        BigDecimal qty = StockRetailValueMath.displayQty(rawQty);
        int alert = product.getLowStockAlert();
        BigDecimal deficit = BigDecimal.valueOf(alert).subtract(qty).max(BigDecimal.ZERO);
        BigDecimal cost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        return new LowStockRowResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBarcode(),
            storeId,
            storeName,
            StockRetailValueMath.scaleQty(qty),
            alert,
            StockRetailValueMath.scaleQty(deficit),
            cost,
            StockRetailValueMath.scaleMoney(StockRetailValueMath.lineValue(cost, rawQty)),
            stockUpdatedAt
        );
    }
}
