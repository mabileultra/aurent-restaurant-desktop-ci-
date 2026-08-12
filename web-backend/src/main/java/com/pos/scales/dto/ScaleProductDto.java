package com.pos.scales.dto;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;

import java.math.BigDecimal;
import java.util.UUID;

public record ScaleProductDto(
    UUID id,
    String sku,
    String name,
    String plu,
    String barcode,
    BigDecimal sellingPrice,
    SaleType saleType,
    UnitCode unitCode,
    int quantityScale,
    boolean allowFraction,
    boolean active,
    BigDecimal stockQuantity
) {}
