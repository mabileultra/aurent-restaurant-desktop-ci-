package com.pos.catalog.dto.product;

public record RetailExtrasDto(
    String clothingSizeRange,
    String clothingColor,
    String clothingGender,
    boolean pharmacyExpiryRequired,
    boolean pharmacyPrescriptionRequired,
    String pharmacyDosageForm
) {}
