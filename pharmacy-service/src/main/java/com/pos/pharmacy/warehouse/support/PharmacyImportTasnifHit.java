package com.pos.pharmacy.warehouse.support;

/** Карточка МХИК из тасниф для импорта: найден / label / одна упаковка / код. */
public record PharmacyImportTasnifHit(
    boolean found,
    boolean labeled,
    String packageCode,
    String catalogText,
    String mxik
) {
    public static PharmacyImportTasnifHit miss() {
        return new PharmacyImportTasnifHit(false, false, null, "", null);
    }
}
