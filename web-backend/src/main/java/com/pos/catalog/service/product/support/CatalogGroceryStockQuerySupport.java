package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.repository.spec.ProductStoreAssortmentSpecifications;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Catalog queries for inventory live stock reports (keeps ProductRepository inside catalog).
 */
@Component
@RequiredArgsConstructor
public class CatalogGroceryStockQuerySupport {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> findActiveForBalanceReport(
        Integer companyId,
        String search,
        Integer categoryId,
        Integer storeId
    ) {
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            companyId, search, categoryId, "ACTIVE", storeId,
            null, null, null, null, null, null
        ).and(ProductStoreAssortmentSpecifications.presentAtStore(storeId));
        return productRepository.findAll(spec.and(fetchCategory()), Sort.by("name").ascending());
    }

    @Transactional(readOnly = true)
    public List<UUID> findGroceryLowStockIds(Integer companyId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 10_000));
        List<String> idRows = productRepository.findGroceryLowStockIds(
            companyId,
            PageRequest.of(0, safeLimit)
        );
        if (idRows == null || idRows.isEmpty()) {
            return List.of();
        }
        return idRows.stream()
            .filter(s -> s != null && !s.isBlank())
            .map(s -> UUID.fromString(s.trim()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<GroceryLowStockStoreHit> findGroceryLowStockStoreHits(
        Integer companyId,
        Integer storeId,
        int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 10_000));
        List<Object[]> rows = productRepository.findGroceryLowStockStoreRows(
            companyId,
            storeId,
            PageRequest.of(0, safeLimit)
        );
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<GroceryLowStockStoreHit> hits = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            if (row == null || row.length < 5 || row[0] == null || row[1] == null) {
                continue;
            }
            hits.add(new GroceryLowStockStoreHit(
                UUID.fromString(String.valueOf(row[0]).trim()),
                ((Number) row[1]).intValue(),
                row[2] != null ? String.valueOf(row[2]) : null,
                toDecimal(row[3]),
                toInstant(row[4])
            ));
        }
        return hits;
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }

    private static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Timestamp ts) {
            return ts.toInstant();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return null;
    }

    private static Specification<Product> fetchCategory() {
        return (root, query, cb) -> {
            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("category", JoinType.LEFT);
                query.distinct(true);
            }
            Predicate conjunction = cb.conjunction();
            return conjunction;
        };
    }
}
