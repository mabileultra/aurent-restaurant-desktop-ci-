package com.pos.catalog.dto.product;

public record RetailExtrasRequest(
    String clothingSizeRange,
    String clothingColor,
    String clothingGender
) {}
