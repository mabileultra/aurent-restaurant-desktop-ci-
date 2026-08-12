package com.pos.scales.dto;

import com.pos.catalog.dto.product.ProductResponse;

import java.math.BigDecimal;

public record DecodeWeightBarcodeResponse(
    String barcode,
    String plu,
    BigDecimal weightKg,
    ProductResponse product
) {}
