package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.dto.product.ProductStorePriceRequest;
import com.pos.catalog.service.imports.ProductImportSupport;
import com.pos.catalog.service.product.ProductCommandService;
import com.pos.catalog.service.product.ProductQuantityRulesResolver;
import com.pos.domain.ProductQuantityRules;
import com.pos.exception.BadRequestException;
import com.pos.util.ProductImportParseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Создание карточки из строки preview.
 * Не зависит от {@code ProductService} (facade тянет import → цикл); только {@link ProductCommandService}.
 */
@Component
@RequiredArgsConstructor
public class ProductImportProductCreator {

    private final ProductImportCatalogRefs catalogRefs;
    private final ProductCommandService productCommandService;

    public UUID create(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultCategoryId,
        Integer defaultStoreId,
        String defaultStorageLocation,
        boolean zeroInitialStock
    ) {
        BigDecimal sellingPrice = resolveSellingPrice(row, rowOpts);
        Integer categoryId = resolveCategoryId(row, rowOpts, defaultCategoryId);
        BigDecimal costPrice = resolveCostPrice(row);
        BigDecimal taxRate = ProductImportParseUtil.normalizeTaxRatePercent(row.taxRatePercent());
        String unitOfMeasure = StringUtils.hasText(row.unitOfMeasure())
            ? row.unitOfMeasure().trim()
            : "dona";
        ProductQuantityRules quantityRules = ProductQuantityRulesResolver.resolve(
            ProductImportSupport.parseImportSaleType(row.importSaleType()),
            null,
            null,
            null,
            unitOfMeasure
        );
        BigDecimal initialStock = resolveInitialStock(row, rowOpts, zeroInitialStock);
        Integer storeId = resolveStoreId(row, rowOpts, defaultStoreId);
        List<ProductStorePriceRequest> storePrices = storeId != null
            ? List.of(new ProductStorePriceRequest(storeId, sellingPrice))
            : null;

        String storageLocation = resolveStorageLocation(row, rowOpts, defaultStorageLocation);
        RowOverrides overrides = RowOverrides.from(row, rowOpts);

        CreateProductRequest req = ProductImportCreateRequestFactory.fromImportRow(
            row.sku(),
            row.name(),
            categoryId,
            costPrice,
            sellingPrice,
            taxRate,
            quantityRules,
            initialStock,
            overrides.barcode(),
            overrides.ikpu(),
            overrides.ikpuStatus(),
            unitOfMeasure,
            overrides.packageCode(),
            overrides.markedProduct(),
            storageLocation,
            row.uzInvoiceDocumentId(),
            storePrices
        );
        return productCommandService.createProduct(req).id();
    }

    private static BigDecimal resolveSellingPrice(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts
    ) {
        BigDecimal resolved = row.fileSellingPrice();
        if (rowOpts != null && rowOpts.sellingPrice() != null) {
            resolved = rowOpts.sellingPrice();
        }
        if (resolved == null || resolved.compareTo(new BigDecimal("0.01")) < 0) {
            throw new BadRequestException("Некорректная цена продажи");
        }
        return resolved;
    }

    private Integer resolveCategoryId(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultCategoryId
    ) {
        Integer categoryId = defaultCategoryId;
        if (rowOpts != null && rowOpts.categoryId() != null) {
            categoryId = catalogRefs.resolveCategoryId(rowOpts.categoryId(), "Строка " + row.rowNum());
        }
        return categoryId;
    }

    private static BigDecimal resolveCostPrice(ProductImportPreviewRow row) {
        BigDecimal raw = row.costPrice();
        if (raw == null) {
            return BigDecimal.ZERO;
        }
        if (raw.signum() < 0) {
            throw new BadRequestException("Себестоимость не может быть отрицательной");
        }
        return raw;
    }

    private static BigDecimal resolveInitialStock(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        boolean zeroInitialStock
    ) {
        if (zeroInitialStock) {
            return BigDecimal.ZERO;
        }
        return ProductImportQuantity.resolve(row, rowOpts);
    }

    private Integer resolveStoreId(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultStoreId
    ) {
        Integer storeId = defaultStoreId;
        if (rowOpts != null && rowOpts.storeId() != null) {
            storeId = catalogRefs.resolveStoreId(rowOpts.storeId(), "Строка " + row.rowNum());
        }
        return storeId;
    }

    private static String resolveStorageLocation(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        String defaultStorageLocation
    ) {
        String storageLocation = row.storageLocation();
        if (rowOpts != null && StringUtils.hasText(rowOpts.storageLocation())) {
            return rowOpts.storageLocation().trim();
        }
        if (!StringUtils.hasText(storageLocation) && StringUtils.hasText(defaultStorageLocation)) {
            return defaultStorageLocation.trim();
        }
        return storageLocation;
    }

    private record RowOverrides(
        String ikpu,
        String barcode,
        String packageCode,
        Boolean markedProduct,
        String ikpuStatus
    ) {
        static RowOverrides from(
            ProductImportPreviewRow row,
            ProductImportConfirmRequest.ImportRowConfirm rowOpts
        ) {
            String ikpu = row.ikpu();
            String barcode = row.barcode();
            String packageCode = null;
            Boolean markedProduct = null;
            String ikpuStatus = null;
            if (rowOpts == null) {
                return new RowOverrides(ikpu, barcode, packageCode, markedProduct, ikpuStatus);
            }
            if (StringUtils.hasText(rowOpts.ikpu())) {
                ikpu = rowOpts.ikpu().trim();
            }
            if (rowOpts.barcode() != null) {
                barcode = StringUtils.hasText(rowOpts.barcode()) ? rowOpts.barcode().trim() : null;
            }
            if (StringUtils.hasText(rowOpts.packageCode())) {
                packageCode = rowOpts.packageCode().trim();
            }
            if (rowOpts.markedProduct() != null) {
                markedProduct = rowOpts.markedProduct();
            }
            if (StringUtils.hasText(rowOpts.ikpuStatus())) {
                ikpuStatus = rowOpts.ikpuStatus().trim();
            }
            return new RowOverrides(ikpu, barcode, packageCode, markedProduct, ikpuStatus);
        }
    }
}
