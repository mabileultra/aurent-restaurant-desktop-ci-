package com.pos.integrations.finance.service.support;

import com.pos.catalog.api.CatalogFacade;
import com.pos.catalog.dto.ref.ProductRef;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.entity.StockLot;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.entity.SaleItemLot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Estimates COGS for a completed sale from lot purchase prices, falling back to catalog cost via {@link CatalogFacade}.
 */
@Component
@RequiredArgsConstructor
public class FinanceSaleCostCalculator {

    private final CatalogFacade catalogFacade;

    public BigDecimal totalCost(Sale sale) {
        if (sale == null || sale.getItems() == null || sale.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (SaleItem item : sale.getItems()) {
            total = total.add(lineCost(item));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal lineCost(SaleItem item) {
        if (item == null) {
            return BigDecimal.ZERO;
        }
        Supplier<BigDecimal> catalogUnitCost = new CachingCatalogCost(item);
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
                fromLots = fromLots.add(qty.multiply(unitCostFromLot(allocation.getLot(), catalogUnitCost)));
            }
            BigDecimal soldQty = soldQuantity(item);
            if (allocatedQty.signum() > 0 && soldQty.compareTo(allocatedQty) > 0) {
                BigDecimal rest = soldQty.subtract(allocatedQty);
                fromLots = fromLots.add(rest.multiply(catalogUnitCost.get()));
            }
            if (fromLots.signum() > 0) {
                return fromLots;
            }
        }
        return soldQuantity(item).multiply(catalogUnitCost.get());
    }

    private static BigDecimal soldQuantity(SaleItem item) {
        BigDecimal qty = nullSafe(item.getQuantity());
        BigDecimal returned = nullSafe(item.getReturnedQuantity());
        BigDecimal sold = qty.subtract(returned);
        return sold.signum() > 0 ? sold : BigDecimal.ZERO;
    }

    private static BigDecimal unitCostFromLot(StockLot lot, Supplier<BigDecimal> productUnitCost) {
        if (lot != null && lot.getPurchasePrice() != null && lot.getPurchasePrice().signum() > 0) {
            return lot.getPurchasePrice();
        }
        return productUnitCost.get();
    }

    private BigDecimal unitCostFromCatalog(SaleItem item) {
        UUID productId = productIdOf(item);
        if (productId == null) {
            return BigDecimal.ZERO;
        }
        try {
            ProductRef ref = catalogFacade.getById(productId);
            return positiveOrZero(ref.costPrice());
        } catch (ResourceNotFoundException ex) {
            return BigDecimal.ZERO;
        }
    }

    private static UUID productIdOf(SaleItem item) {
        return item != null ? item.getProductId() : null;
    }

    private static BigDecimal positiveOrZero(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    private static BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private final class CachingCatalogCost implements Supplier<BigDecimal> {
        private final SaleItem item;
        private BigDecimal cached;
        private boolean resolved;

        private CachingCatalogCost(SaleItem item) {
            this.item = item;
        }

        @Override
        public BigDecimal get() {
            if (!resolved) {
                cached = unitCostFromCatalog(item);
                resolved = true;
            }
            return cached;
        }
    }
}
