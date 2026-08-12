package com.pos.scales.dto;

import java.math.BigDecimal;

public record EncodeWeightBarcodeResponse(
    String barcode,
    String plu,
    BigDecimal weightKg
) {}
