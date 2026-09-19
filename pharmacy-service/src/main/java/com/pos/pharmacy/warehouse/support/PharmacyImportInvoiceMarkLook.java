package com.pos.pharmacy.warehouse.support;

import java.util.List;
import java.util.Locale;

/** Флаг «Маркировкаланган» на фактуре — это не DataMatrix. */
public final class PharmacyImportInvoiceMarkLook {

    private PharmacyImportInvoiceMarkLook() {
    }

    public static boolean of(List<String> row) {
        if (row == null || row.isEmpty()) {
            return false;
        }
        for (String cell : row) {
            if (flagCell(cell)) {
                return true;
            }
        }
        return false;
    }

    public static boolean flagCell(String cell) {
        if (cell == null || cell.isBlank()) {
            return false;
        }
        String text = cell.toLowerCase(Locale.ROOT)
            .replace('ё', 'е')
            .replace('қ', 'к')
            .replace('ҳ', 'х');
        return text.contains("маркировкаланган") || text.contains("markirovkalangan");
    }
}
