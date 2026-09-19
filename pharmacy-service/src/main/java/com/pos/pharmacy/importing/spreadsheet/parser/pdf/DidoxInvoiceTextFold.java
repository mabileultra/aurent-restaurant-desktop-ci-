package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.Locale;

/** Узбекская кириллица к одной форме, чтобы «Раҳбар» находился как «рахбар». */
public final class DidoxInvoiceTextFold {

    private DidoxInvoiceTextFold() {}

    public static String fold(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String text = raw.toLowerCase(Locale.ROOT);
        return text
            .replace('ҳ', 'х')
            .replace('қ', 'к')
            .replace('ғ', 'г')
            .replace('ў', 'у')
            .replace('‘', '\'')
            .replace('’', '\'')
            .replace('ʻ', '\'');
    }
}
