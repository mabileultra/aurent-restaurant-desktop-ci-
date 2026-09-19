package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** MXIK/ИКПУ 14–17 цифр в ячейке Didox. */
public final class DidoxInvoiceMxik {

    private static final Pattern MXIK = Pattern.compile("\\d{14,17}");

    private DidoxInvoiceMxik() {}

    public static String first(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = MXIK.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group();
    }

    public static String first(java.util.List<String> cells) {
        if (cells == null) {
            return null;
        }
        for (String cell : cells) {
            String code = first(cell);
            if (code != null) {
                return code;
            }
        }
        return null;
    }
}
