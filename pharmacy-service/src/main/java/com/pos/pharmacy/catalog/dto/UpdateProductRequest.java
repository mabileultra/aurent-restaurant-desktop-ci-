package com.pos.pharmacy.catalog.dto;

import jakarta.validation.Valid;

import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record UpdateProductRequest(
    String name,
    String description,
    BigDecimal sellingPrice,
    BigDecimal defaultDiscountPercent,
    BigDecimal costPrice,
    BigDecimal taxRate,
    ProductType productType,
    SaleType saleType,
    UnitCode unitCode,
    Integer quantityScale,
    Boolean allowFraction,
    Integer lowStockAlert,
    String imageUrl,
    Integer categoryId,
    String externalProductId,
    String ikpu,
    String ikpuStatus,
    String unitOfMeasure,
    String unitMeasureCode,
    String packageCode,
    Boolean soldIndividually,
    Boolean markedProduct,
    String storageLocation,
    Boolean active,
    String ownerType,
    String commissionTin,
    String commissionPinfl,
    String barcode,
    String plu,
    @Valid List<ProductStorePriceRequest> storePrices,
    List<String> additionalBarcodes,
    ServiceProductDetailsRequest serviceDetails,
    RetailExtrasRequest retailExtras,
    String businessTypeCode,
    Map<String, String> attributes
) {}
