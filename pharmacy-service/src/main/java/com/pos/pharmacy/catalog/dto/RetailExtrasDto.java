package com.pos.pharmacy.catalog.dto;

public record RetailExtrasDto(
    String clothingSizeRange,
    String clothingColor,
    String clothingGender,
    boolean pharmacyExpiryRequired,
    boolean pharmacyPrescriptionRequired,
    String pharmacyDosageForm
) {}
