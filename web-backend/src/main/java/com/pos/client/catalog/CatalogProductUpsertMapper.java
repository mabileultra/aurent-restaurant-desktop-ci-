package com.pos.client.catalog;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.shared.catalog.CatalogLegacyIds;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class CatalogProductUpsertMapper {

    public CatalogProductUpsertRequest toUpsert(Product product) {
        if (product == null || product.getId() == null || product.getCompany() == null) {
            return null;
        }
        Integer companyId = product.getCompany().getId();
        List<String> extras = product.getExtraBarcodes() == null
            ? List.of()
            : product.getExtraBarcodes().stream().map(ProductBarcode::getBarcode).toList();
        String businessTypeCode = product.getBusinessType() != null
            ? product.getBusinessType().getCode()
            : null;
        UUID categoryId = null;
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            categoryId = CatalogLegacyIds.categoryId(companyId, product.getCategory().getId());
        }
        return new CatalogProductUpsertRequest(
            product.getId(),
            companyId,
            product.getSku(),
            product.getName(),
            product.getDescription(),
            categoryId,
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getDefaultDiscountPercent(),
            product.getTaxRate(),
            product.getProductType() != null ? product.getProductType().name() : "RETAIL",
            product.getSaleType() != null ? product.getSaleType().name() : "PIECE",
            product.getUnitCode() != null ? product.getUnitCode().name() : "PCS",
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
            product.getStorageLocation(),
            businessTypeCode
        );
    }
}
