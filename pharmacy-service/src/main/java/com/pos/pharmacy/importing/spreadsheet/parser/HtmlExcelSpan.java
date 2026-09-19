package com.pos.pharmacy.importing.spreadsheet.parser;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** colspan / rowspan у HTML-ячейки SpreadsheetML. */
public final class HtmlExcelSpan {

    private static final Pattern COLSPAN = Pattern.compile("colspan\\s*=\\s*[\"']?(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern ROWSPAN = Pattern.compile("rowspan\\s*=\\s*[\"']?(\\d+)", Pattern.CASE_INSENSITIVE);

    private HtmlExcelSpan() {}

    public static int colspan(String attrs) {
        return span(attrs, COLSPAN);
    }

    public static int rowspan(String attrs) {
        return span(attrs, ROWSPAN);
    }

    private static int span(String attrs, Pattern pattern) {
        if (attrs == null || attrs.isBlank()) {
            return 1;
        }
        Matcher matcher = pattern.matcher(attrs);
        if (!matcher.find()) {
            return 1;
        }
        int value = Integer.parseInt(matcher.group(1));
        return Math.max(1, Math.min(value, 32));
    }
}
