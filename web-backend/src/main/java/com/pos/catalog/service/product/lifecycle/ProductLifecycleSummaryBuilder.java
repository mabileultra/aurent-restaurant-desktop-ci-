package com.pos.catalog.service.product.lifecycle;

import com.pos.catalog.dto.product.ProductLifecycleSummaryResponse;
import com.pos.catalog.entity.Product;
import com.pos.inventory.repository.stock.StockMovementQueryRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class ProductLifecycleSummaryBuilder {

    private final StockMovementQueryRepository stockMovementQueryRepository;

    public ProductLifecycleSummaryBuilder(StockMovementQueryRepository stockMovementQueryRepository) {
        this.stockMovementQueryRepository = stockMovementQueryRepository;
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

        return new ProductLifecycleSummaryResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getStockQuantity(),
            dispatched,
            product.getCreatedAt(),
            totals.restockUnits(),
            totals.saleUnits(),
            totals.returnUnits(),
            totals.writeOffUnits(),
            totals.adjustmentNetUnits()
        );
    }
}
