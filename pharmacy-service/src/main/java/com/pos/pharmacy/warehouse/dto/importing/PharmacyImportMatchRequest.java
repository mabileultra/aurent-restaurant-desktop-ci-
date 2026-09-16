package com.pos.pharmacy.warehouse.dto.importing;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record PharmacyImportMatchRequest(
    @NotNull Map<String, Integer> roles,
    @NotEmpty List<List<String>> rows,
    boolean useFinalSums,
    String uzInvoiceDocumentId
) {}
