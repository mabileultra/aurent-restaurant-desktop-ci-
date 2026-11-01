package com.pos.inventory.service.stock.impl;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.service.product.support.StockRetailValueMath;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.service.stock.LiveStockReportService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.LiveStockBalanceRowMapper;
import com.pos.service.support.TenantAccessSupport;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LiveStockReportServiceImpl implements LiveStockReportService {

    private final ProductRepository productRepository;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<StockBalanceRowResponse> balances(
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            companyId, search, categoryId, "ACTIVE", storeId,
            null, null, null, null, null, null
        );
        // Load candidates then filter/paginate with live store_stock qty.
        List<Product> products = productRepository.findAll(
            spec.and(fetchCategory()),
            org.springframework.data.domain.Sort.by("name").ascending()
        );
        List<UUID> ids = products.stream().map(Product::getId).toList();
        Map<UUID, BigDecimal> liveQty = storeId != null
            ? storeStockService.getQuantities(ids, storeId)
            : storeStockService.sumQuantities(ids);

        List<StockBalanceRowResponse> rows = new ArrayList<>();
        for (Product product : products) {
            BigDecimal raw = liveQty.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal qty = StockRetailValueMath.displayQty(raw);
            if (onlyWithStock && qty.signum() <= 0) {
                continue;
            }
            rows.add(LiveStockBalanceRowMapper.toBalance(product, raw));
        }
        return PageResponse.from(toPage(rows, pageable));
    }

    @Override
    public PageResponse<LowStockRowResponse> lowStock(Pageable pageable) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        List<String> idRows = productRepository.findGroceryLowStockIds(
            companyId,
            org.springframework.data.domain.PageRequest.of(0, 10_000)
        );
        if (idRows == null || idRows.isEmpty()) {
            return PageResponse.from(Page.empty(pageable));
        }
        List<UUID> ids = idRows.stream()
            .filter(s -> s != null && !s.isBlank())
            .map(s -> UUID.fromString(s.trim()))
            .toList();
        Map<UUID, Product> byId = new java.util.LinkedHashMap<>();
        for (Product p : productRepository.findAllById(ids)) {
            byId.put(p.getId(), p);
        }
        Map<UUID, BigDecimal> liveQty = storeStockService.sumQuantities(ids);
        List<LowStockRowResponse> rows = new ArrayList<>();
        for (UUID id : ids) {
            Product product = byId.get(id);
            if (product == null) {
                continue;
            }
            BigDecimal raw = liveQty.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal qty = StockRetailValueMath.displayQty(raw);
            int alert = product.getLowStockAlert();
            if (qty.compareTo(BigDecimal.valueOf(alert)) > 0) {
                continue;
            }
            rows.add(LiveStockBalanceRowMapper.toLowStock(product, raw));
        }
        return PageResponse.from(toPage(rows, pageable));
    }

    private static Specification<Product> fetchCategory() {
        return (root, query, cb) -> {
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("category", JoinType.LEFT);
                query.distinct(true);
            }
            return cb.conjunction();
        };
    }

    private static <T> Page<T> toPage(List<T> rows, Pageable pageable) {
        int start = (int) Math.min(pageable.getOffset(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }
}
