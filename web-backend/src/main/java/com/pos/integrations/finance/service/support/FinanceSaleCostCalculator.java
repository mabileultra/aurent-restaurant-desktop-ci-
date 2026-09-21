package com.pos.integrations.finance.service.support;

import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockLot;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.entity.SaleItemLot;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Estimates COGS for a completed sale from lot purchase prices, falling back to product cost.
 */
public final class FinanceSaleCostCalculator {

    private FinanceSaleCostCalculator() {
    }

    public static BigDecimal totalCost(Sale sale) {
        if (sale == null || sale.getItems() == null || sale.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (SaleItem item : sale.getItems()) {
            total = total.add(lineCost(item));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal lineCost(SaleItem item) {
        if (item == null) {
            return BigDecimal.ZERO;
        }
        List<SaleItemLot> allocations = item.getLotAllocations();
        if (allocations != null && !allocations.isEmpty()) {
            BigDecimal fromLots = BigDecimal.ZERO;
            BigDecimal allocatedQty = BigDecimal.ZERO;
            for (SaleItemLot allocation : allocations) {
                BigDecimal qty = nullSafe(allocation.getQuantity());
                if (qty.signum() <= 0) {
                    continue;
                }
                allocatedQty = allocatedQty.add(qty);
                fromLots = fromLots.add(qty.multiply(unitCostFromLot(allocation.getLot(), item.getProduct())));
            }
            BigDecimal soldQty = soldQuantity(item);
            if (allocatedQty.signum() > 0 && soldQty.compareTo(allocatedQty) > 0) {
                BigDecimal rest = soldQty.subtract(allocatedQty);
                fromLots = fromLots.add(rest.multiply(unitCostFromProduct(item.getProduct())));
            }
            if (fromLots.signum() > 0) {
                return fromLots;
            }
        }
        return soldQuantity(item).multiply(unitCostFromProduct(item.getProduct()));
    }

    private static BigDecimal soldQuantity(SaleItem item) {
        BigDecimal qty = nullSafe(item.getQuantity());
        BigDecimal returned = nullSafe(item.getReturnedQuantity());
        BigDecimal sold = qty.subtract(returned);
        return sold.signum() > 0 ? sold : BigDecimal.ZERO;
    }

    private static BigDecimal unitCostFromLot(StockLot lot, Product product) {
        if (lot != null && lot.getPurchasePrice() != null && lot.getPurchasePrice().signum() > 0) {
            return lot.getPurchasePrice();
        }
        return unitCostFromProduct(product);
    }

    private static BigDecimal unitCostFromProduct(Product product) {
        if (product == null || product.getCostPrice() == null) {
            return BigDecimal.ZERO;
        }
        return product.getCostPrice().signum() > 0 ? product.getCostPrice() : BigDecimal.ZERO;
    }

    private static BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
