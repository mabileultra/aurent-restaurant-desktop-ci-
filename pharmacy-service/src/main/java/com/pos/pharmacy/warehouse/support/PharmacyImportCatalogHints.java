package com.pos.pharmacy.warehouse.support;

/** Флаги карточки после фактуры и тасниф. */
public record PharmacyImportCatalogHints(
    boolean markedProduct,
    Boolean prescriptionRequired,
    String packageCode,
    String ikpuStatus
) {
}
