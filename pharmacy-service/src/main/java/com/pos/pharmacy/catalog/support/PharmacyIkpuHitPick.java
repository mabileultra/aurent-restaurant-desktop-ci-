package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * При нескольких карточках с одним ИКПУ выбираем ту, что можно продать на кассе:
 * активная + остаток на магазине (или денорм stock_quantity).
 */
@Component
@RequiredArgsConstructor
public class PharmacyIkpuHitPick {

    private final StoreStockService storeStockService;

    public Product pick(List<Product> hits, Integer storeId) {
        if (hits == null || hits.isEmpty()) {
            return null;
        }
        if (hits.size() == 1) {
            return hits.get(0);
        }
        Map<UUID, BigDecimal> storeQty = storeQty(hits, storeId);
        List<Product> ranked = new ArrayList<>(hits);
        ranked.sort(Comparator
            .comparing((Product p) -> p.isActive() ? 0 : 1)
            .thenComparing((Product p) -> qty(p, storeQty).signum() > 0 ? 0 : 1)
            .thenComparing((Product p) -> qty(p, storeQty).negate())
            .thenComparing(p -> p.getName() == null ? "" : p.getName()));
        return ranked.get(0);
    }

    private Map<UUID, BigDecimal> storeQty(List<Product> hits, Integer storeId) {
        if (storeId == null) {
            return Map.of();
        }
        List<UUID> ids = hits.stream().map(Product::getId).filter(id -> id != null).toList();
        return storeStockService.getQuantities(storeId, ids);
    }

    private static BigDecimal qty(Product product, Map<UUID, BigDecimal> storeQty) {
        if (product.getId() != null && storeQty.containsKey(product.getId())) {
            BigDecimal q = storeQty.get(product.getId());
            return q != null ? q : BigDecimal.ZERO;
        }
        BigDecimal denorm = product.getStockQuantity();
        return denorm != null ? denorm : BigDecimal.ZERO;
    }
}
