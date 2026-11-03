package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
        );
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
