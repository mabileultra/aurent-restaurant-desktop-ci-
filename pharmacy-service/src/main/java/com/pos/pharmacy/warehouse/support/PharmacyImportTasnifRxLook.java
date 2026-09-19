package com.pos.pharmacy.warehouse.support;

import java.util.Locale;

/** Рецепт из текста тасниф, только если на фактуре колонка пустая. */
public final class PharmacyImportTasnifRxLook {

    private PharmacyImportTasnifRxLook() {
    }

    public static Boolean of(PharmacyImportTasnifHit hit) {
        if (hit == null || !hit.found()) {
            return null;
        }
        String text = hit.catalogText() == null ? "" : hit.catalogText().toLowerCase(Locale.ROOT);
        if (text.isBlank()) {
            return null;
        }
        if (text.contains("рецептсиз") || text.contains("retseptsiz")) {
            return Boolean.FALSE;
        }
        if (text.contains("рецепт") || text.contains("retsept") || text.contains("prescription")) {
            return Boolean.TRUE;
        }
        return null;
    }
}
