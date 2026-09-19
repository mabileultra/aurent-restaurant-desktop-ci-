package com.pos.pharmacy.warehouse.support;

import java.util.List;

/** Упаковка Didox/тасниф: подставляем только если она одна. */
public final class PharmacyImportTasnifPackagePick {

    private PharmacyImportTasnifPackagePick() {
    }

    public static String single(List<String> codes) {
        if (codes == null) {
            return null;
        }
        String only = null;
        for (String code : codes) {
            if (code == null || code.isBlank()) {
                continue;
            }
            String value = code.trim();
            if (!real(value)) {
                continue;
            }
            if (only == null) {
                only = value;
            } else if (!only.equals(value)) {
                return null;
            }
        }
        return only;
    }

    static boolean real(String code) {
        return code != null && code.matches("\\d{3,}") && !"1".equals(code);
    }
}
