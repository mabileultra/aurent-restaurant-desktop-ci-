package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogGroceryStockQuerySupport;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.catalog.service.product.support.GroceryLowStockStoreHit;
import com.pos.catalog.service.product.support.StockRetailValueMath;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.inventory.service.stock.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Builds live low-stock report rows (per store_stock branch). */
@Component
@RequiredArgsConstructor
public class LiveStockLowStockAssembler {

    private final CatalogGroceryStockQuerySupport catalogGroceryStockQuery;
    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final StoreStockService storeStockService;

    public List<LowStockRowResponse> assemble(Integer companyId, Integer storeId) {
        if (storeId != null) {
            storeStockService.requireStoreForCompany(companyId, storeId);
        }
        List<GroceryLowStockStoreHit> hits =
            catalogGroceryStockQuery.findGroceryLowStockStoreHits(companyId, storeId, 10_000);
        if (hits.isEmpty()) {
            return List.of();
        }
        List<UUID> productIds = hits.stream().map(GroceryLowStockStoreHit::productId).distinct().toList();
        Map<UUID, Product> byId = new LinkedHashMap<>();
        for (Product product : catalogManagedProductLoader.findAllById(productIds)) {
            byId.put(product.getId(), product);
        }
        List<LowStockRowResponse> rows = new ArrayList<>(hits.size());
        for (GroceryLowStockStoreHit hit : hits) {
            Product product = byId.get(hit.productId());
            if (product == null) {
                continue;
            }
            BigDecimal raw = hit.quantity() != null ? hit.quantity() : BigDecimal.ZERO;
            BigDecimal qty = StockRetailValueMath.displayQty(raw);
            int alert = product.getLowStockAlert();
            if (qty.compareTo(BigDecimal.valueOf(alert)) > 0) {
                continue;
            }
            rows.add(LiveStockBalanceRowMapper.toLowStock(
                product,
                raw,
                hit.updatedAt(),
                hit.storeId(),
                hit.storeName()
            ));
        }
        rows.sort((a, b) -> {
            if (a.stockUpdatedAt() == null && b.stockUpdatedAt() == null) {
                return 0;
            }
            if (a.stockUpdatedAt() == null) {
                return 1;
            }
            if (b.stockUpdatedAt() == null) {
                return -1;
            }
            return b.stockUpdatedAt().compareTo(a.stockUpdatedAt());
        });
        return rows;
    }
}
