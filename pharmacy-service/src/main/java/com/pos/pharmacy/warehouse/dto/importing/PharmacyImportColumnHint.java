package com.pos.pharmacy.warehouse.dto.importing;

public record PharmacyImportColumnHint(
    int index,
    String header,
    String suggestedRole
) {}
