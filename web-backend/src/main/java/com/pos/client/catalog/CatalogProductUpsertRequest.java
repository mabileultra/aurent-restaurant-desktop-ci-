package com.pos.client.catalog;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CatalogProductUpsertRequest(
    UUID id,
    Integer companyId,
    String sku,
    String name,
    String description,
    UUID categoryId,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    BigDecimal defaultDiscountPercent,
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
    String ikpuStatus,
    String unitOfMeasure,
    Boolean soldIndividually,
    Boolean markedProduct,
    String storageLocation,
    String businessTypeCode
) {
}
