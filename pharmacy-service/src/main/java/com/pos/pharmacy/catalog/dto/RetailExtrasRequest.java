package com.pos.pharmacy.catalog.dto;

public record RetailExtrasRequest(
    String clothingSizeRange,
    String clothingColor,
    String clothingGender,
    Boolean pharmacyExpiryRequired,
    Boolean pharmacyPrescriptionRequired,
    String pharmacyDosageForm
) {}
