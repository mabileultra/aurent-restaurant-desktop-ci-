package com.pos.restaurant.report.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * Staff names live in identity-service and UI texts in the frontend locale,
 * so the client sends both; missing labels fall back to Russian defaults.
 */
public record ReceiptExportRequest(
    @NotNull @Valid ReceiptJournalFilter filter,
    @Size(max = 2000) Map<String, String> userNames,
    @Size(max = 200) Map<String, String> labels,
    @Size(max = 64) String timeZone
) {
}
