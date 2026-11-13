package com.pos.pharmacy.catalog.registry.dto;

import java.util.UUID;

public record DrugRegistryHit(
    UUID id,
    String tradeName,
    String registrationNumber,
    String manufacturer,
    String country,
    String dosageForm,
    String atcCode,
    Boolean prescriptionRequired
) {
}
