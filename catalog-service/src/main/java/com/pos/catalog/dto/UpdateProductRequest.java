package com.pos.catalog.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UpdateProductRequest(
    String sku,
    String name,
    String description,
    UUID categoryId,
    @DecimalMin("0") BigDecimal costPrice,
    @DecimalMin("0.01") BigDecimal sellingPrice,
    @DecimalMin("0") BigDecimal defaultDiscountPercent,
    BigDecimal taxRate,
    String productType,
    String saleType,
    String unitCode,
    Integer quantityScale,
    Boolean allowFraction,
    Integer lowStockAlert,
    String barcode,
    List<String> additionalBarcodes,
    String plu,
    String imageUrl,
    Boolean active,
    String externalProductId,
    String ikpu,
    String unitOfMeasure,
    Boolean soldIndividually,
    Boolean markedProduct,
    String storageLocation,
    String businessTypeCode
) {
}
