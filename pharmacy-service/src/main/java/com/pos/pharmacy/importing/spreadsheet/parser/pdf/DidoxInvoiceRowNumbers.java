package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Номер товарной строки в первой колонке Didox («1 Трусы…»). */
public final class DidoxInvoiceRowNumbers {

    private static final Pattern LEADING = Pattern.compile("^(\\d{1,3})(?:\\s+|$)");

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

    public static String strip(String col0) {
        if (col0 == null || col0.isBlank()) {
            return "";
        }
        String text = col0.trim();
        Integer number = leading(text);
        if (number == null) {
            return text;
        }
        String prefix = String.valueOf(number);
        if (text.equals(prefix)) {
            return "";
        }
        if (text.startsWith(prefix) && Character.isWhitespace(text.charAt(prefix.length()))) {
            return text.substring(prefix.length()).trim();
        }
        return text;
    }
}
