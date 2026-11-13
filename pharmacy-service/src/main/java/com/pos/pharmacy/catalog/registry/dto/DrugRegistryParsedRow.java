package com.pos.pharmacy.catalog.registry.dto;

public record DrugRegistryParsedRow(
    String tradeName,
    String registrationNumber,
    String inn,
    String dosageForm,
    String manufacturer,
    String country,
    String atcCode,
    Boolean prescriptionRequired
) {
}
