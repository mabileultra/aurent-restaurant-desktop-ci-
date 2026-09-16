package com.pos.catalog.service;

import com.pos.catalog.dto.product.BulkTaxRateRequest;
import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductExportPreviewRow;
import com.pos.catalog.dto.product.ProductExportRequest;
import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportResponse;
import com.pos.catalog.dto.product.ProductLifecycleResponse;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.product.UpdateProductRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.WarehouseReceiveRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ProductService {

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
        return getWarehouseProducts(search, barcodeContains, markedProduct, null, pageable);
    }

    PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Pageable pageable
    );

    ProductResponse getProduct(UUID id, Integer storeId);

    ProductLifecycleResponse getProductLifecycle(
        UUID id,
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        Pageable pageable
    );

    ProductResponse getByBarcode(String barcode);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    ProductResponse createProduct(CreateProductRequest req);

    ProductResponse updateProduct(UUID id, UpdateProductRequest req);

    ProductResponse adjustStock(UUID id, BigDecimal quantity, String movementType, String notes, Integer storeId);

    ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req);

    void deactivateProduct(UUID id);

    int bulkUpdateTaxRate(BulkTaxRateRequest req);

    int bulkDeactivateProducts(List<UUID> productIds);

    List<ProductResponse> getLowStockProducts();

    List<ProductExportPreviewRow> previewProductsExport(String storeIdsParam, BigDecimal markupPercent);

    byte[] exportProductsCatalogExcel(ProductExportRequest request);

    byte[] buildImportTemplateExcel();

    ProductImportPreviewResponse previewProductsImport(
        MultipartFile file,
        String source,
        String defaultStorageLocation
    );

    ProductImportResponse importFromFile(MultipartFile file, ProductImportConfirmRequest options);
}
