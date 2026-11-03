package com.pos.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductCardResponse(
    UUID id,
    Integer companyId,
    String sku,
    String name,
    String description,
    UUID categoryId,
    String categoryName,
    String businessTypeCode,
    String productType,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    BigDecimal defaultDiscountPercent,
    BigDecimal taxRate,
    String saleType,
    String unitCode,
    int quantityScale,
    boolean allowFraction,
    int lowStockAlert,
    String barcode,
    List<String> additionalBarcodes,
    String plu,
    String imageUrl,
    boolean active,
    String externalProductId,
    String ikpu,
    String ikpuStatus,
    String unitOfMeasure,
    boolean soldIndividually,
    boolean markedProduct,
    String storageLocation
) {
}
