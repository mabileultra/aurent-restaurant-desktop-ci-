package com.pos.pharmacy.warehouse.dto.importing;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PharmacyImportConfirmRequest(
    String uzInvoiceDocumentId,
    @NotEmpty List<PharmacyImportConfirmItem> items
) {}
