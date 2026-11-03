package com.pos.catalog.service.product.lifecycle;

import com.pos.catalog.dto.product.ProductLifecycleSummaryResponse;
import com.pos.catalog.entity.Product;
import com.pos.inventory.repository.stock.StockMovementQueryRepository;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.util.QuantityUtil;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class ProductLifecycleSummaryBuilder {

    private final StockMovementQueryRepository stockMovementQueryRepository;
    private final StoreStockService storeStockService;

    public ProductLifecycleSummaryBuilder(
        StockMovementQueryRepository stockMovementQueryRepository,
        StoreStockService storeStockService
    ) {
        this.stockMovementQueryRepository = stockMovementQueryRepository;
        this.storeStockService = storeStockService;
    }

    public ProductLifecycleSummaryResponse build(
        Product product,
        Instant start,
        Instant end,
        Integer storeId
    ) {
        ProductLifecycleTypeTotals totals = ProductLifecycleTypeTotals.fromRows(
            stockMovementQueryRepository.sumQuantitiesByTypeForProduct(product.getId(), start, end, storeId)
        );
        long dispatched = stockMovementQueryRepository.sumDispatchedByProductId(product.getId());
        BigDecimal currentStock = resolveCurrentStock(product.getId(), storeId);

        return new ProductLifecycleSummaryResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            currentStock,
            dispatched,
            product.getCreatedAt(),
            totals.restockUnits(),
            totals.saleUnits(),
            totals.returnUnits(),
            totals.writeOffUnits(),
            totals.adjustmentNetUnits()
        );
    }

    private BigDecimal resolveCurrentStock(java.util.UUID productId, Integer storeId) {
        if (storeId != null) {
            return storeStockService.getQuantity(productId, storeId);
        }
        return storeStockService.sumQuantities(List.of(productId))
            .getOrDefault(productId, BigDecimal.ZERO.setScale(QuantityUtil.SCALE));
    }
}
