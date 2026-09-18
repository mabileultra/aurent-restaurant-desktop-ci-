package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

/**
 * Сборка страницы каталога: batch attrs + stock (без N+1), параллельно на catalog-пуле.
 */
@Component
public class ProductListResponseAssembler {

    private final ProductAttributeService productAttributeService;
    private final StoreStockService storeStockService;
    private final Executor catalogExecutor;

    public ProductListResponseAssembler(
        ProductAttributeService productAttributeService,
        StoreStockService storeStockService,
        @Qualifier(PharmacyExecutorNames.CATALOG) Executor catalogExecutor
    ) {
        this.productAttributeService = productAttributeService;
        this.storeStockService = storeStockService;
        this.catalogExecutor = catalogExecutor;
    }

    public List<ProductResponse> assemble(List<Product> products, Integer storeId) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).toList();

        Supplier<Map<UUID, Map<String, String>>> attrsTask =
            () -> productAttributeService.getAttributesByProductIds(ids);
        Supplier<Map<UUID, BigDecimal>> stockTask = storeId == null
            ? Map::of
            : () -> storeStockService.getQuantities(storeId, ids);

        @SuppressWarnings("unchecked")
        List<Supplier<Object>> tasks = List.of(
            () -> attrsTask.get(),
            () -> stockTask.get()
        );
        List<Object> loaded = PharmacyParallelTasks.supplyAll(tasks, catalogExecutor);
        @SuppressWarnings("unchecked")
        Map<UUID, Map<String, String>> attrsById = (Map<UUID, Map<String, String>>) loaded.get(0);
        @SuppressWarnings("unchecked")
        Map<UUID, BigDecimal> stockById = (Map<UUID, BigDecimal>) loaded.get(1);

        List<ProductResponse> out = new ArrayList<>(products.size());
        for (Product product : products) {
            Map<String, String> attributes = attrsById.getOrDefault(product.getId(), Map.of());
            BigDecimal stockQty = storeId != null
                ? stockById.getOrDefault(product.getId(), BigDecimal.ZERO)
                : (product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO);
            out.add(toResponse(product, stockQty, attributes));
        }
        return out;
    }

    static ProductResponse toResponse(Product product, BigDecimal stockQty, Map<String, String> attributes) {
        BigDecimal qty = stockQty != null ? stockQty : BigDecimal.ZERO;
        boolean lowStock = qty.compareTo(BigDecimal.valueOf(product.getLowStockAlert())) <= 0;
        return new ProductResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getCategoryId(),
            null,
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getDefaultDiscountPercent(),
            product.getTaxRate(),
            product.getProductType(),
            product.getSaleType(),
            product.getUnitCode(),
            product.getQuantityScale(),
            product.isAllowFraction(),
            qty,
            0,
            product.getLowStockAlert(),
            lowStock,
            product.getBarcode(),
            product.getPlu(),
            List.of(),
            product.getImageUrl(),
            product.isActive(),
            product.getCreatedAt(),
            product.getExternalProductId(),
            product.getIkpu(),
            product.getIkpuStatus(),
            product.getUnitOfMeasure(),
            product.getUnitMeasureCode(),
            product.getPackageCode(),
            product.isSoldIndividually(),
            product.isMarkedProduct(),
            product.getStorageLocation(),
            product.getOwnerType(),
            product.getCommissionTin(),
            product.getCommissionPinfl(),
            0,
            List.of(),
            null,
            null,
            attributes != null ? attributes : Map.of()
        );
    }
}
