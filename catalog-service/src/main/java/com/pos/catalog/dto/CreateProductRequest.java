package com.pos.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateProductRequest(
    @NotBlank String sku,
    @NotBlank String name,
    String description,
    UUID categoryId,
    @NotNull @DecimalMin("0") BigDecimal costPrice,
    @NotNull @DecimalMin("0.01") BigDecimal sellingPrice,
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
    String externalProductId,
    String ikpu,
    String unitOfMeasure,
    Boolean soldIndividually,
    Boolean markedProduct,
    String storageLocation,
    String businessTypeCode
) {
}
