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
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Catalog list totals with the same Specification as the products page.
 * Distinct by product id so search joins do not inflate sums.
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
            root.get("stockQuantity").alias("qty")
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
        Map<UUID, BigDecimal> qtyById = new HashMap<>();
        Set<UUID> seen = new HashSet<>();
        for (Tuple row : rows) {
            UUID id = row.get("id", UUID.class);
            if (id == null || !seen.add(id)) {
                continue;
            }
            priceById.put(id, coalesce(row.get("price", BigDecimal.class)));
            qtyById.put(id, coalesce(row.get("qty", BigDecimal.class)));
        }

        List<UUID> ids = new ArrayList<>(seen);
        Map<UUID, BigDecimal> liveQty = storeId != null
            ? storeStockService.getQuantities(ids, storeId)
            : storeStockService.sumQuantities(ids);
        for (UUID id : ids) {
            if (liveQty.containsKey(id)) {
                qtyById.put(id, liveQty.get(id));
            }
        }

        BigDecimal qtyTotal = BigDecimal.ZERO;
        BigDecimal valueTotal = BigDecimal.ZERO;
        for (UUID id : ids) {
            BigDecimal qty = qtyById.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal price = priceById.getOrDefault(id, BigDecimal.ZERO);
            qtyTotal = qtyTotal.add(qty);
            valueTotal = valueTotal.add(price.multiply(qty));
        }

        return new ProductCatalogTotalsResponse(
            ids.size(),
            qtyTotal.setScale(3, RoundingMode.HALF_UP),
            valueTotal.setScale(2, RoundingMode.HALF_UP)
        );
    }

    private static BigDecimal coalesce(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
