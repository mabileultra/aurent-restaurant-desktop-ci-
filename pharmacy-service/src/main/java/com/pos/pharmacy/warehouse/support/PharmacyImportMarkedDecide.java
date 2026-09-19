package com.pos.pharmacy.warehouse.support;

/** Маркировка карточки: фактура, label тасниф, или «не нашёлся». */
public final class PharmacyImportMarkedDecide {

    private PharmacyImportMarkedDecide() {
    }

    public static boolean apply(boolean invoiceMarked, PharmacyImportTasnifHit hit) {
        if (invoiceMarked) {
            return true;
        }
        if (hit == null) {
            return false;
        }
        if (!hit.found()) {
            return true;
        }
        return hit.labeled();
    }
}
