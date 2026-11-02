package com.pos.catalog.mapper;

import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.ProductRefResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductCardMapper {

    public ProductRefResponse toRef(Product product) {
        boolean weighted = "WEIGHT".equalsIgnoreCase(product.getSaleType());
        return new ProductRefResponse(
            product.getId(),
            product.getCompanyId(),
            product.getSku(),
            product.getName(),
            product.getBarcode(),
            product.getIkpu(),
            product.getSellingPrice(),
            product.getCostPrice(),
            product.getUnitCode(),
            product.isActive(),
            weighted
        );
    }

    public ProductCardResponse toCard(Product product) {
        List<String> extras = product.getExtraBarcodes() == null
            ? List.of()
            : product.getExtraBarcodes().stream().map(ProductBarcode::getBarcode).toList();
        return new ProductCardResponse(
            product.getId(),
            product.getCompanyId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getCategory() != null ? product.getCategory().getId() : null,
            product.getCategory() != null ? product.getCategory().getName() : null,
            product.getBusinessTypeCode(),
            product.getProductType(),
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getDefaultDiscountPercent(),
            product.getTaxRate(),
            product.getSaleType(),
            product.getUnitCode(),
            product.getQuantityScale(),
            product.isAllowFraction(),
            product.getLowStockAlert(),
            product.getBarcode(),
            extras,
            product.getPlu(),
            product.getImageUrl(),
            product.isActive(),
            product.getExternalProductId(),
            product.getIkpu(),
            product.getIkpuStatus(),
            product.getUnitOfMeasure(),
            product.isSoldIndividually(),
            product.isMarkedProduct(),
            product.getStorageLocation()
        );
    }
}
