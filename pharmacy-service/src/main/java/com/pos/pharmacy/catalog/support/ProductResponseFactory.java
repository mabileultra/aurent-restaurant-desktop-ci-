package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductResponseFactory {

    private final ProductAttributeService productAttributeService;
    private final StoreStockService storeStockService;

    public ProductResponse toResponse(Product product, Integer storeId) {
        Map<String, String> attributes = productAttributeService.getAttributes(product.getId());
        BigDecimal stockQty = storeId != null
            ? storeStockService.getQuantity(product.getId(), storeId)
            : product.getStockQuantity();
        boolean lowStock = stockQty.compareTo(BigDecimal.valueOf(product.getLowStockAlert())) <= 0;
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
            stockQty,
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
            attributes
        );
    }
}
