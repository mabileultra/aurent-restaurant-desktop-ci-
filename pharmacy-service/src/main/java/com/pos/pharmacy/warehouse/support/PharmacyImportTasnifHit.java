package com.pos.pharmacy.warehouse.support;

/** Карточка МХИК из тасниф для импорта: найден / label / одна упаковка. */
public record PharmacyImportTasnifHit(
    boolean found,
    boolean labeled,
    String packageCode,
    String catalogText
) {
    public static PharmacyImportTasnifHit miss() {
        return new PharmacyImportTasnifHit(false, false, null, "");
    }
}
