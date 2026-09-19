package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** Убирает № строки Didox из наименования: «1 Кюпен таб» → «Кюпен таб». */
public final class DidoxInvoiceNameNumberStrip {

    private static final Pattern NAME_BODY = Pattern.compile(".*\\p{L}{3,}.*");

    private DidoxInvoiceNameNumberStrip() {
    }

    public static List<List<String>> apply(List<List<String>> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<List<String>> out = new ArrayList<>(rows.size());
        for (List<String> row : rows) {
            out.add(peelRow(row));
        }
        return out;
    }

    public static String peel(String col0) {
        if (col0 == null || col0.isBlank()) {
            return col0 == null ? "" : col0;
        }
        String rest = DidoxInvoiceRowNumbers.strip(col0);
        if (rest.isBlank() || rest.equals(col0.trim()) || !NAME_BODY.matcher(rest).matches()) {
            return col0.trim();
        }
        return rest;
    }

    private static List<String> peelRow(List<String> row) {
        if (row == null || row.isEmpty()) {
            return row == null ? List.of() : new ArrayList<>(row);
        }
        List<String> next = new ArrayList<>(row);
        next.set(0, peel(row.get(0)));
        return next;
    }
}
