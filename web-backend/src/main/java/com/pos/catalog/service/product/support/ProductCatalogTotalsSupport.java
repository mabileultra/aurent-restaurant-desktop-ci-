package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductCatalogTotalsResponse;
import com.pos.catalog.entity.Product;
import com.pos.inventory.service.stock.StoreStockService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Catalog / dashboard stock totals from live store_stock + product prices.
 * Missing store row → qty 0 (no stale product.stockQuantity fallback).
 */
@Component
@RequiredArgsConstructor
public class ProductCatalogTotalsSupport {

    private final EntityManager entityManager;
    private final StoreStockService storeStockService;

    public ProductCatalogTotalsResponse summarize(Specification<Product> spec, Integer storeId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> cq = cb.createTupleQuery();
        Root<Product> root = cq.from(Product.class);
        cq.multiselect(
            root.get("id").alias("id"),
            root.get("sellingPrice").alias("price"),
            root.get("costPrice").alias("cost")
        );
        Predicate predicate = spec.toPredicate(root, cq, cb);
        if (predicate != null) {
            cq.where(predicate);
        }
        cq.distinct(true);

        List<Tuple> rows = entityManager.createQuery(cq).getResultList();
        if (rows.isEmpty()) {
            return ProductCatalogTotalsResponse.empty();
        }

        Map<UUID, BigDecimal> priceById = new HashMap<>();
        Map<UUID, BigDecimal> costById = new HashMap<>();
        Set<UUID> seen = new HashSet<>();
        for (Tuple row : rows) {
            UUID id = row.get("id", UUID.class);
            if (id == null || !seen.add(id)) {
                continue;
            }
            BigDecimal price = row.get("price", BigDecimal.class);
            BigDecimal cost = row.get("cost", BigDecimal.class);
            priceById.put(id, price != null ? price : BigDecimal.ZERO);
            costById.put(id, cost != null ? cost : BigDecimal.ZERO);
        }

        List<UUID> ids = new ArrayList<>(seen);
        Map<UUID, BigDecimal> liveQty = storeId != null
            ? storeStockService.getQuantities(ids, storeId)
            : storeStockService.sumQuantities(ids);

        BigDecimal qtyTotal = BigDecimal.ZERO;
        BigDecimal retailTotal = BigDecimal.ZERO;
        BigDecimal costTotal = BigDecimal.ZERO;
        for (UUID id : ids) {
            BigDecimal rawQty = liveQty.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal qty = StockRetailValueMath.displayQty(rawQty);
            qtyTotal = qtyTotal.add(qty);
            retailTotal = retailTotal.add(
                StockRetailValueMath.lineValue(priceById.getOrDefault(id, BigDecimal.ZERO), rawQty)
            );
            costTotal = costTotal.add(
                StockRetailValueMath.lineValue(costById.getOrDefault(id, BigDecimal.ZERO), rawQty)
            );
        }

        return new ProductCatalogTotalsResponse(
            ids.size(),
            StockRetailValueMath.scaleQty(qtyTotal),
            StockRetailValueMath.scaleMoney(retailTotal),
            StockRetailValueMath.scaleMoney(costTotal)
        );
    }
}
