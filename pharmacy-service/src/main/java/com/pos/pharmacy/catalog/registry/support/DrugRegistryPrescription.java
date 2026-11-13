package com.pos.pharmacy.catalog.registry.support;

import java.util.Locale;

public final class DrugRegistryPrescription {

    private DrugRegistryPrescription() {
    }

    public static Boolean parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.toLowerCase(Locale.ROOT);
        if (text.contains("рецептсиз") || text.contains("retseptsiz")
            || text.contains("без рецепт") || text.contains("otc")) {
            return Boolean.FALSE;
        }
        if (text.contains("рецепт") || text.contains("retsept") || text.contains("prescription")) {
            return Boolean.TRUE;
        }
        if (text.equals("да") || text.equals("true") || text.equals("yes") || text.equals("1")) {
            return Boolean.TRUE;
        }
        if (text.equals("нет") || text.equals("false") || text.equals("no") || text.equals("0")) {
            return Boolean.FALSE;
        }
        return null;
    }
}
