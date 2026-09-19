package com.pos.pharmacy.warehouse.support;

import java.util.Locale;

/** «Рецептли» / «Рецептсиз» в колонке выдачи Didox. */
public final class PharmacyImportInvoiceRxLook {

    private PharmacyImportInvoiceRxLook() {
    }

    public static Boolean of(String cell) {
        if (cell == null || cell.isBlank()) {
            return null;
        }
        String text = cell.toLowerCase(Locale.ROOT)
            .replace('ё', 'е')
            .replace('қ', 'к')
            .replace('ҳ', 'х')
            .replace('ў', 'у');
        if (text.contains("рецептсиз") || text.contains("retseptsiz") || text.contains("без рецепт")) {
            return Boolean.FALSE;
        }
        if (text.contains("рецептли") || text.contains("retseptli") || text.contains("рецептур")) {
            return Boolean.TRUE;
        }
        return null;
    }
}
