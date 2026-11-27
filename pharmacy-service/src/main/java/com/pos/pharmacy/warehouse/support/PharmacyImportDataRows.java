package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportSkippedRow;

import java.util.List;

/** Товарные строки + то, что парсер отсёк (для UI «63→61»). */
public record PharmacyImportDataRows(
    List<List<String>> rows,
    List<PharmacyImportSkippedRow> skipped
) {
    public PharmacyImportDataRows {
        rows = rows == null ? List.of() : List.copyOf(rows);
        skipped = skipped == null ? List.of() : List.copyOf(skipped);
    }
}
