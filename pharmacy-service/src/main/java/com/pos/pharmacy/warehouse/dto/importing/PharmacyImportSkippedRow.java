package com.pos.pharmacy.warehouse.dto.importing;

/** Строка сетки фактуры, отсечённая до матча (подвал / шапка / пусто). */
public record PharmacyImportSkippedRow(
    int gridRow,
    String reason,
    String preview
) {
}
