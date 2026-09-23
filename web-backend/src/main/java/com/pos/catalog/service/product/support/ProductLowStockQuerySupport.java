package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Low-stock для grocery-каталога и обзора: живой остаток из store_stock / products,
 * без зависимости от reporting-фактов (они часто отстают → на дашборде «0»).
 */
@Component
@RequiredArgsConstructor
public class ProductLowStockQuerySupport {

    private static final int DEFAULT_LIMIT = 500;

    private final ProductRepository productRepository;
    private final ProductResponseAssembler assembler;
    private final CatalogIsolationSupport catalogIsolation;
    private final TenantAccessSupport tenantAccess;
    private final StoreStockService storeStockService;

    public List<ProductResponse> list(int limit) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        int safeLimit = Math.max(1, Math.min(limit, DEFAULT_LIMIT));
        List<String> idRows = productRepository.findGroceryLowStockIds(
            companyId,
            PageRequest.of(0, safeLimit)
        );
        if (idRows == null || idRows.isEmpty()) {
            return List.of();
        }

        List<UUID> ids = new ArrayList<>(idRows.size());
        for (String raw : idRows) {
            if (raw != null && !raw.isBlank()) {
                ids.add(UUID.fromString(raw.trim()));
            }
        }
        if (ids.isEmpty()) {
            return List.of();
        }

        Map<UUID, Product> productsById = new LinkedHashMap<>();
        for (Product product : productRepository.findAllById(ids)) {
            productsById.put(product.getId(), product);
        }
        Map<UUID, BigDecimal> stockById = storeStockService.sumQuantities(ids);

        List<ProductResponse> result = new ArrayList<>();
        for (UUID id : ids) {
            Product product = productsById.get(id);
            if (product == null || catalogIsolation.isPharmacyProduct(product)) {
                continue;
            }
            ProductResponse base = assembler.toResponse(product);
            BigDecimal stockQty = resolveQty(product, stockById);
            result.add(assembler.withStockQuantity(base, stockQty));
        }
        return result;
    }

    private static BigDecimal resolveQty(Product product, Map<UUID, BigDecimal> stockById) {
        if (stockById.containsKey(product.getId())) {
            BigDecimal summed = stockById.get(product.getId());
            return summed != null ? summed : BigDecimal.ZERO;
        }
        return product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
    }
}
