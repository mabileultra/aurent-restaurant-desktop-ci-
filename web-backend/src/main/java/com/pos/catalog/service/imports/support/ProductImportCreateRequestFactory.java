package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductStorePriceRequest;
import com.pos.catalog.service.product.ProductTypeSupport;
import com.pos.domain.ProductQuantityRules;
import com.pos.domain.ProductType;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;

import java.math.BigDecimal;
import java.util.List;

/**
 * Сборка {@link CreateProductRequest} для импорта без длинного списка позиционных null в creator.
 * unitOfMeasure — подпись из файла; unitCode — канонический код из quantity rules.
 */
final class ProductImportCreateRequestFactory {

    private ProductImportCreateRequestFactory() {
    }

    static CreateProductRequest fromImportRow(
        String sku,
        String name,
        Integer categoryId,
        BigDecimal costPrice,
        BigDecimal sellingPrice,
        BigDecimal taxRate,
        ProductQuantityRules quantityRules,
        BigDecimal initialStock,
        String barcode,
        String ikpu,
        String ikpuStatus,
        String unitOfMeasure,
        String packageCode,
        Boolean markedProduct,
        String storageLocation,
        String uzInvoiceDocumentId,
        List<ProductStorePriceRequest> storePrices
    ) {
        SaleType saleType = quantityRules.saleType();
        ProductType productType = ProductTypeSupport.resolve(null, saleType);
        UnitCode unitCode = quantityRules.unitCode();
        Integer quantityScale = quantityRules.quantityScale();
        Boolean allowFraction = quantityRules.allowFraction();
        return new CreateProductRequest(
            sku,
            name,
            null,
            categoryId,
            costPrice,
            sellingPrice,
            BigDecimal.ZERO,
            taxRate,
            productType,
            saleType,
            unitCode,
            quantityScale,
            allowFraction,
            initialStock,
            10,
            barcode,
            null,
            null,
            null,
            ikpu,
            ikpuStatus,
            unitOfMeasure,
            null,
            packageCode,
            null,
            markedProduct,
            storageLocation,
            null,
            null,
            null,
            uzInvoiceDocumentId,
            storePrices,
            null,
            null,
            null,
            null,
            null
        );
    }
}
