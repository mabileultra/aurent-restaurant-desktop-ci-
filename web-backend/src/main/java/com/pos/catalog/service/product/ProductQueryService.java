package com.pos.catalog.service.product;

import com.pos.catalog.dto.product.ProductCatalogTotalsResponse;
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

    /**
     * Offline cashier bootstrap: active company products that have store_stock at {@code storeId}
     * (qty may be zero). Admin catalog list must not use this — it keeps company-wide cards.
     */
    PageResponse<ProductResponse> getCashierStoreProducts(Integer storeId, Pageable pageable);

    default PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        return getWarehouseProducts(search, barcodeContains, markedProduct, null, null, null, pageable);
    }

    default PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Pageable pageable
    ) {
        return getWarehouseProducts(search, barcodeContains, markedProduct, businessTypeCode, null, null, pageable);
    }

    default PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Integer storeId,
        Pageable pageable
    ) {
        return getWarehouseProducts(search, barcodeContains, markedProduct, businessTypeCode, storeId, null, pageable);
    }

    PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Integer storeId,
        String receiptNumber,
        Pageable pageable
    );

    ProductResponse getProduct(java.util.UUID id, Integer storeId);

    ProductResponse getByBarcode(String barcode);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    java.util.List<ProductResponse> getLowStockProducts();

    ProductCatalogTotalsResponse getCatalogTotals(
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
        String businessTypeCode
    );
}
