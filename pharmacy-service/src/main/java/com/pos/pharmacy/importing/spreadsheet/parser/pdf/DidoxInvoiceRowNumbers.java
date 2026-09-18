package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Номер товарной строки в первой колонке Didox («1 Трусы…»). */
public final class DidoxInvoiceRowNumbers {

    private static final Pattern LEADING = Pattern.compile("^(\\d{1,3})(?![0-9.,%])");

    private DidoxInvoiceRowNumbers() {
    }

    public static Integer leading(String col0) {
        if (col0 == null || col0.isBlank()) {
            return null;
        }
        Matcher matcher = LEADING.matcher(col0.trim());
        if (!matcher.find()) {
            return null;
        }
        int value = Integer.parseInt(matcher.group(1));
        if (value < 1 || value > 999) {
            return null;
        }
        return value;
    }
}
