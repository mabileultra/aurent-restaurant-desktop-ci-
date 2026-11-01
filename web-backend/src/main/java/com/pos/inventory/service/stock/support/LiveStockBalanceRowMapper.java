package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.StockRetailValueMath;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;

import java.math.BigDecimal;

public final class LiveStockBalanceRowMapper {

    private LiveStockBalanceRowMapper() {}

    public static StockBalanceRowResponse toBalance(Product product, BigDecimal rawQty) {
        BigDecimal qty = StockRetailValueMath.displayQty(rawQty);
        BigDecimal cost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        return new StockBalanceRowResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBarcode(),
            product.getCategory() != null ? product.getCategory().getName() : null,
            StockRetailValueMath.scaleQty(qty),
            product.getLowStockAlert(),
            cost,
            StockRetailValueMath.scaleMoney(StockRetailValueMath.lineValue(cost, rawQty))
        );
    }

    public static LowStockRowResponse toLowStock(Product product, BigDecimal rawQty) {
        BigDecimal qty = StockRetailValueMath.displayQty(rawQty);
        int alert = product.getLowStockAlert();
        BigDecimal deficit = BigDecimal.valueOf(alert).subtract(qty).max(BigDecimal.ZERO);
        BigDecimal cost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        return new LowStockRowResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBarcode(),
            StockRetailValueMath.scaleQty(qty),
            alert,
            StockRetailValueMath.scaleQty(deficit),
            cost,
            StockRetailValueMath.scaleMoney(StockRetailValueMath.lineValue(cost, rawQty))
        );
    }
}
