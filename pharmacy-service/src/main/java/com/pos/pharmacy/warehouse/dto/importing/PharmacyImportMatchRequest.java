package com.pos.pharmacy.warehouse.dto.importing;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record PharmacyImportMatchRequest(
    @NotNull Map<String, Integer> roles,
    @NotEmpty List<List<String>> rows,
    boolean useFinalSums,
    String uzInvoiceDocumentId,
    /** Global start index when FE chunks a large Excel (0-based). */
    Integer rowOffset,
    /** Full invoice row count for SKU duplicate scan across chunks. */
    Integer totalRows
) {
    public PharmacyImportMatchRequest(
        Map<String, Integer> roles,
        List<List<String>> rows,
        boolean useFinalSums,
        String uzInvoiceDocumentId
    ) {
        this(roles, rows, useFinalSums, uzInvoiceDocumentId, null, null);
    }
}
