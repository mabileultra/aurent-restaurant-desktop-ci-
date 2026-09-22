package com.pos.catalog.service.product;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface ProductQueryService {

    default PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Map<String, String> attributeFilters,
        Pageable pageable
    ) {
        return getProducts(
            search, categoryId, activeOnly, deletedScope, storeId, ikpuStatus,
            markedProduct, soldIndividually, barcodeExact, attributeFilters, null, pageable
        );
    }

    PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Map<String, String> attributeFilters,
        String businessTypeCode,
        Pageable pageable
    );

    default PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        return getWarehouseProducts(search, barcodeContains, markedProduct, null, null, pageable);
    }

    default PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Pageable pageable
    ) {
        return getWarehouseProducts(search, barcodeContains, markedProduct, businessTypeCode, null, pageable);
    }

    PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Integer storeId,
        Pageable pageable
    );

    ProductResponse getProduct(java.util.UUID id, Integer storeId);

    ProductResponse getByBarcode(String barcode);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    java.util.List<ProductResponse> getLowStockProducts();
}
