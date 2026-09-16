package com.pos.catalog.service.product.support;

import com.pos.client.reporting.ReportingStockReportClient;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.service.support.CatalogIsolationSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductLowStockQuerySupport {

    private static final int DEFAULT_LIMIT = 500;

    private final ReportingStockReportClient reportingStockReportClient;
    private final ProductRepository productRepository;
    private final ProductResponseAssembler assembler;
    private final CatalogIsolationSupport catalogIsolation;

    public List<ProductResponse> list(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, DEFAULT_LIMIT));
        List<LowStockRowResponse> rows = reportingStockReportClient.lowStock(0, safeLimit).content();
        if (rows.isEmpty()) {
            return List.of();
        }

        List<UUID> productIds = rows.stream()
            .map(LowStockRowResponse::productId)
            .filter(id -> id != null)
            .distinct()
            .toList();
        if (productIds.isEmpty()) {
            return List.of();
        }

        Map<UUID, Product> productsById = productRepository.findAllById(productIds).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<ProductResponse> result = new ArrayList<>();
        for (LowStockRowResponse row : rows) {
            Product product = productsById.get(row.productId());
            if (product == null || catalogIsolation.isPharmacyProduct(product)) {
                continue;
            }
            ProductResponse base = assembler.toResponse(product);
            BigDecimal stockQty = row.stockQuantity() != null ? row.stockQuantity() : BigDecimal.ZERO;
            result.add(assembler.withStockQuantity(base, stockQty));
        }
        return result;
    }
}
